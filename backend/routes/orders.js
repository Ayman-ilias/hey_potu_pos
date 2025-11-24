const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT o.*, c.customer_name,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'subtotal', oi.subtotal
               )
             ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, c.customer_name
      ORDER BY o.order_date DESC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT o.*, c.customer_name,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'subtotal', oi.subtotal
               )
             ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, c.customer_name
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { customer_id, customer_name, items, notes } = req.body;

        // Generate order number
        const orderNumber = 'ORD-' + Date.now();

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        // Insert order
        const orderResult = await client.query(`
      INSERT INTO orders (order_number, customer_id, customer_name, total_amount, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [orderNumber, customer_id, customer_name, totalAmount, notes]);

        const orderId = orderResult.rows[0].id;

        // Insert order items and update product stock
        for (const item of items) {
            // Insert order item
            await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]);

            // Update product sold items
            await client.query(`
        UPDATE products 
        SET sold_items = sold_items + $1
        WHERE id = $2
      `, [item.quantity, item.product_id]);
        }

        await client.query('COMMIT');

        // Fetch complete order
        const completeOrder = await pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'subtotal', oi.subtotal
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [orderId]);

        res.status(201).json(completeOrder.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
});

// Update order status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const result = await pool.query(`
      UPDATE orders 
      SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { id } = req.params;

        // Get order items to restore stock
        const itemsResult = await client.query(`
      SELECT product_id, quantity FROM order_items WHERE order_id = $1
    `, [id]);

        // Restore stock for each product
        for (const item of itemsResult.rows) {
            await client.query(`
        UPDATE products 
        SET sold_items = sold_items - $1
        WHERE id = $2
      `, [item.quantity, item.product_id]);
        }

        // Delete order (cascade will delete order_items)
        const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Order deleted successfully', order: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    } finally {
        client.release();
    }
});

module.exports = router;
