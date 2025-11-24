const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        // Total products
        const productsCount = await pool.query('SELECT COUNT(*) FROM products');

        // Total customers
        const customersCount = await pool.query('SELECT COUNT(*) FROM customers');

        // Total orders
        const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');

        // Total revenue
        const revenue = await pool.query('SELECT SUM(total_amount) as total FROM orders');

        // Low stock items
        const lowStock = await pool.query(`
      SELECT COUNT(*) FROM products WHERE remaining_items <= 10 AND remaining_items > 0
    `);

        // Recent orders
        const recentOrders = await pool.query(`
      SELECT o.*, c.customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);

        // Top selling products
        const topProducts = await pool.query(`
      SELECT p.item_name, p.sold_items, p.item_category
      FROM products p
      WHERE p.sold_items > 0
      ORDER BY p.sold_items DESC
      LIMIT 5
    `);

        res.json({
            stats: {
                totalProducts: parseInt(productsCount.rows[0].count),
                totalCustomers: parseInt(customersCount.rows[0].count),
                totalOrders: parseInt(ordersCount.rows[0].count),
                totalRevenue: parseFloat(revenue.rows[0].total || 0),
                lowStockCount: parseInt(lowStock.rows[0].count)
            },
            recentOrders: recentOrders.rows,
            topProducts: topProducts.rows
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Inventory report
router.get('/inventory', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        serial_no, product_code, item_name, item_category, 
        unit, total_stock, sold_items, remaining_items, price,
        (sold_items * price) as revenue
      FROM products
      ORDER BY item_category, item_name
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ error: 'Failed to generate inventory report' });
    }
});

// Sales report
router.get('/sales', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
      SELECT 
        o.order_number, o.order_date, o.total_amount, o.status,
        c.customer_name, c.phone,
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

        const params = [];
        if (start_date && end_date) {
            query += ' WHERE o.order_date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }

        query += ' GROUP BY o.id, c.customer_name, c.phone ORDER BY o.order_date DESC';

        const result = await pool.query(query, params);

        // Calculate totals
        const totalSales = result.rows.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

        res.json({
            orders: result.rows,
            summary: {
                totalOrders: result.rows.length,
                totalSales: totalSales,
                averageOrderValue: result.rows.length > 0 ? totalSales / result.rows.length : 0
            }
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Failed to generate sales report' });
    }
});

// Customer purchase report
router.get('/customers', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        c.id, c.customer_name, c.phone, c.email,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      ORDER BY total_spent DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error generating customer report:', error);
        res.status(500).json({ error: 'Failed to generate customer report' });
    }
});

// Category-wise sales
router.get('/category-sales', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        p.item_category,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.item_category
      ORDER BY total_revenue DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error generating category sales report:', error);
        res.status(500).json({ error: 'Failed to generate category sales report' });
    }
});

module.exports = router;
