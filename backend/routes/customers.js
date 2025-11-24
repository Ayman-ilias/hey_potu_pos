const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM customers 
      ORDER BY created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get all customers with their purchased products (efficient single query)
router.get('/with-products', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        c.id,
        c.customer_name,
        c.phone,
        c.email,
        c.address,
        c.created_at,
        COALESCE(
          json_agg(
            DISTINCT p.item_name
            ORDER BY p.item_name
          ) FILTER (WHERE p.item_name IS NOT NULL),
          '[]'
        ) as purchased_products
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY c.id, c.customer_name, c.phone, c.email, c.address, c.created_at
      ORDER BY c.created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching customers with products:', error);
        res.status(500).json({ error: 'Failed to fetch customers with products' });
    }
});

// Get single customer
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Get customer with purchase history
router.get('/:id/orders', async (req, res) => {
    try {
        const { id } = req.params;

        // Get customer info
        const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get orders
        const ordersResult = await pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_name', oi.product_name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'subtotal', oi.subtotal
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `, [id]);

        res.json({
            customer: customerResult.rows[0],
            orders: ordersResult.rows
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
});

// Create customer
router.post('/', async (req, res) => {
    try {
        const { customer_name, phone, email, address } = req.body;

        const result = await pool.query(`
      INSERT INTO customers (customer_name, phone, email, address)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [customer_name, phone, email, address]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, phone, email, address } = req.body;

        const result = await pool.query(`
      UPDATE customers 
      SET customer_name = $1, phone = $2, email = $3, address = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [customer_name, phone, email, address, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully', customer: result.rows[0] });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;
