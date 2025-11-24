import React, { useState, useEffect } from 'react';
import { ordersAPI, customersAPI, productsAPI } from '../utils/api';
import { exportOrdersToPDF } from '../utils/pdfExport';
import { exportOrdersToExcel } from '../utils/excelExport';
import './Orders.css';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        notes: '',
        items: [],
    });
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, customersRes, productsRes] = await Promise.all([
                ordersAPI.getAll(),
                customersAPI.getAll(),
                productsAPI.getAll(),
            ]);
            setOrders(ordersRes.data);
            setCustomers(customersRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addItemToOrder = () => {
        if (!selectedProduct) return;

        const product = products.find(p => p.id === parseInt(selectedProduct));
        if (!product) return;

        const existingItem = formData.items.find(item => item.product_id === product.id);

        if (existingItem) {
            setFormData({
                ...formData,
                items: formData.items.map(item =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                ),
            });
        } else {
            setFormData({
                ...formData,
                items: [...formData.items, {
                    product_id: product.id,
                    product_name: product.item_name,
                    quantity,
                    unit_price: product.price,
                    subtotal: product.price * quantity,
                }],
            });
        }

        setSelectedProduct('');
        setQuantity(1);
    };

    const removeItem = (productId) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.product_id !== productId),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            alert('Please add at least one item to the order');
            return;
        }

        try {
            const customer = customers.find(c => c.id === parseInt(formData.customer_id));
            await ordersAPI.create({
                ...formData,
                customer_name: customer?.customer_name || 'Walk-in',
            });
            fetchData();
            closeModal();
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error creating order');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this order? This will restore the stock.')) {
            try {
                await ordersAPI.delete(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting order:', error);
            }
        }
    };

    const openModal = () => {
        setFormData({
            customer_id: '',
            customer_name: '',
            notes: '',
            items: [],
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const totalAmount = formData.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <h2>Orders Management</h2>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => exportOrdersToPDF(orders)}>
                        📄 Export PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportOrdersToExcel(orders)}>
                        📊 Export Excel
                    </button>
                    <button className="btn btn-primary" onClick={openModal}>
                        ➕ Create Order
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total Amount</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td><strong>{order.order_number}</strong></td>
                                <td>{order.customer_name || 'N/A'}</td>
                                <td>{new Date(order.order_date).toLocaleString()}</td>
                                <td><strong className="text-green">৳{order.total_amount}</strong></td>
                                <td>
                                    {order.items && order.items.length > 0 && (
                                        <details>
                                            <summary>{order.items.length} items</summary>
                                            <ul className="items-list">
                                                {order.items.map((item, idx) => (
                                                    <li key={idx}>
                                                        {item.product_name} × {item.quantity} = ৳{item.subtotal}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    )}
                                </td>
                                <td><span className="badge badge-success">{order.status}</span></td>
                                <td>
                                    <button className="btn-icon" onClick={() => handleDelete(order.id)} title="Delete">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="empty-state">
                        <p>No orders found</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <h3>Create New Order</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Customer</label>
                                <select
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.customer_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                />
                            </div>

                            <div className="add-item-section">
                                <h4>Add Items</h4>
                                <div className="grid grid-3">
                                    <div className="input-group">
                                        <label>Product</label>
                                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                                            <option value="">Select product...</option>
                                            {products.filter(p => p.remaining_items > 0).map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.item_name} (Stock: {p.remaining_items}) - ৳{p.price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>&nbsp;</label>
                                        <button type="button" className="btn btn-secondary" onClick={addItemToOrder} style={{ width: '100%' }}>
                                            ➕ Add Item
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {formData.items.length > 0 && (
                                <div className="order-items-preview">
                                    <h4>Order Items</h4>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Price</th>
                                                    <th>Subtotal</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map(item => (
                                                    <tr key={item.product_id}>
                                                        <td>{item.product_name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>৳{item.unit_price}</td>
                                                        <td><strong>৳{item.subtotal}</strong></td>
                                                        <td>
                                                            <button type="button" className="btn-icon" onClick={() => removeItem(item.product_id)}>
                                                                ❌
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: 'right' }}><strong>Total:</strong></td>
                                                    <td colSpan="2"><strong className="text-green">৳{totalAmount.toFixed(2)}</strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;
