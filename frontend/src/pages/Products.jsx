import React, { useState, useEffect } from 'react';
import { productsAPI } from '../utils/api';
import { exportProductsToPDF } from '../utils/pdfExport';
import { exportProductsToExcel } from '../utils/excelExport';
import './Products.css';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        serial_no: '',
        product_code: '',
        item_name: '',
        item_category: '',
        unit: 'pcs',
        total_stock: 0,
        price: 0,
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productsAPI.getAll();
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await productsAPI.update(editingProduct.id, formData);
            } else {
                await productsAPI.create(formData);
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productsAPI.delete(id);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                serial_no: '',
                product_code: '',
                item_name: '',
                item_category: '',
                unit: 'pcs',
                total_stock: 0,
                price: 0,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter(p =>
        p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.item_category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <h2>Inventory Management</h2>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="🔍 Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button className="btn btn-secondary" onClick={() => exportProductsToPDF(products)}>
                        📄 Export PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportProductsToExcel(products)}>
                        📊 Export Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        ➕ Add Product
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Serial No</th>
                            <th>Code</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Unit</th>
                            <th>Total Stock</th>
                            <th>Sold</th>
                            <th>Remaining</th>
                            <th>Price (৳)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} className={product.remaining_items <= 10 ? 'low-stock' : ''}>
                                <td style={{ color: 'black' }}>{product.serial_no}</td>
                                <td style={{ color: 'black' }}>{product.product_code}</td>
                                <td><strong>{product.item_name}</strong></td>
                                <td>{product.item_category}</td>
                                <td>{product.unit}</td>
                                <td style={{ color: 'black' }}>{product.total_stock}</td>
                                <td style={{ color: 'black' }}>{product.sold_items}</td>
                                <td>
                                    {product.remaining_items <= 10 ? (
                                        <span className="badge badge-warning">{product.remaining_items}</span>
                                    ) : (
                                        <span style={{ color: 'black' }}>{product.remaining_items}</span>
                                    )}
                                </td>
                                <td>৳{product.price}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => openModal(product)} title="Edit">✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(product.id)} title="Delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <p>No products found</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Serial No *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.serial_no}
                                        onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Product Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.product_code}
                                        onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={formData.item_category}
                                        onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="set">Set</option>
                                        <option value="box">Box</option>
                                        <option value="kg">Kilogram</option>
                                        <option value="ltr">Liter</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Total Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.total_stock}
                                        onChange={(e) => setFormData({ ...formData, total_stock: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Price (৳)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;
