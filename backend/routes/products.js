const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, serial_no, product_code, item_name, item_category, 
             unit, total_stock, sold_items, remaining_items, price,
             created_at, updated_at
      FROM products 
      ORDER BY created_at DESC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const { serial_no, product_code, item_name, item_category, unit, total_stock, price } = req.body;

        const result = await pool.query(`
      INSERT INTO products (serial_no, product_code, item_name, item_category, unit, total_stock, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [serial_no, product_code, item_name, item_category, unit || 'pcs', total_stock || 0, price || 0]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Product code or serial number already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { serial_no, product_code, item_name, item_category, unit, total_stock, price } = req.body;

        const result = await pool.query(`
      UPDATE products 
      SET serial_no = $1, product_code = $2, item_name = $3, item_category = $4,
          unit = $5, total_stock = $6, price = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [serial_no, product_code, item_name, item_category, unit, total_stock, price, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully', product: result.rows[0] });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get low stock products
router.get('/alerts/low-stock', async (req, res) => {
    try {
        const threshold = req.query.threshold || 10;
        const result = await pool.query(`
      SELECT * FROM products 
      WHERE remaining_items <= $1 AND remaining_items > 0
      ORDER BY remaining_items ASC
    `, [threshold]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
});

module.exports = router;
