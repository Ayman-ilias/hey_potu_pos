import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../utils/api';
import './Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await reportsAPI.getDashboard();
            setStats(response.data.stats);
            setRecentOrders(response.data.recentOrders);
            setTopProducts(response.data.topProducts);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Dashboard Overview</h2>
                <p>Welcome to Hey Potu POS System</p>
            </div>

            <div className="stats-grid grid grid-3">
                <div className="stat-card green">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3>{stats?.totalProducts || 0}</h3>
                        <p>Total Products</p>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-info">
                        <h3>{stats?.totalOrders || 0}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>

                <div className="stat-card blue">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{stats?.totalCustomers || 0}</h3>
                        <p>Total Customers</p>
                    </div>
                </div>
            </div>

            {stats?.lowStockCount > 0 && (
                <div className="alert-banner">
                    <span className="alert-icon">⚠️</span>
                    <span>You have {stats.lowStockCount} products with low stock!</span>
                </div>
            )}

            <div className="dashboard-content grid grid-2">
                <div className="card">
                    <h3>Recent Orders</h3>
                    {recentOrders.length > 0 ? (
                        <div className="orders-list">
                            {recentOrders.map(order => (
                                <div key={order.id} className="order-item">
                                    <div className="order-info">
                                        <strong>{order.order_number}</strong>
                                        <p>{order.customer_name || 'Walk-in'}</p>
                                    </div>
                                    <div className="order-amount">
                                        <strong>৳{order.total_amount}</strong>
                                        <p>{new Date(order.order_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No recent orders</p>
                    )}
                </div>

                <div className="card">
                    <h3>Top Selling Products</h3>
                    {topProducts.length > 0 ? (
                        <div className="products-list">
                            {topProducts.map((product, idx) => (
                                <div key={idx} className="product-item">
                                    <div className="product-rank">{idx + 1}</div>
                                    <div className="product-info">
                                        <strong>{product.item_name}</strong>
                                        <p>{product.item_category}</p>
                                    </div>
                                    <div className="product-sold">
                                        <strong>{product.sold_items}</strong>
                                        <p>sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No sales data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
