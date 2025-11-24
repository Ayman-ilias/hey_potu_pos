# Hey Potu - POS System

Modern Point of Sale system for Hey Potu kids brand with inventory management, order tracking, and customer management.

![Hey Potu Logo](./logo.jpg)

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed on Windows 11
- Port 1111 available
- Port forwarding enabled on router for port 1111

### Installation & Running

1. **Start the application:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Local: `http://localhost:1111`
   - Network: `http://192.168.0.199:1111`

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

## 📱 Features

### ✅ Product Management
- Add, edit, and delete products
- Track serial numbers and product codes
- Monitor stock levels (total, sold, remaining)
- Low stock alerts
- Category management
- Export to PDF/Excel

### ✅ Order Management
- Create new orders with multiple items
- Link orders to customers
- Real-time stock updates
- Order history tracking
- Export orders to PDF/Excel

### ✅ Customer Management
- Customer database with contact information
- Purchase history tracking
- Customer analytics
- Export to PDF/Excel

### ✅ Reports & Analytics
- **Dashboard:**with key metrics
  - Total products, orders, customers
  - Revenue tracking
  - Low stock alerts
  - Recent orders overview
  - Top selling products

- **Inventory Report:**
  - Complete stock overview
  - Revenue per product
  - Export to Excel

- **Sales Report:**
  - Date range filtering
  - Total sales and order count
  - Average order value
  - Export to Excel

- **Customer Report:**
  - Customer purchase history
  - Total spent per customer
  - Order frequency

## 🎨 Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL 15
- **Deployment:** Docker Compose
- **Export:** jsPDF, xlsx

## 🎯 Color Scheme (From Logo)

- 🟢 Green: `#7CB342` (hey)
- 🟠 Orange: `#FF5722` (potu)
- 🟡 Yellow: `#FFC107` (dash)
- 🔵 Light Blue: `#4FC3F7` (dot)

## 📂 Project Structure

```
hey-potu-pos/
├── docker-compose.yml
├── .env
├── logo.jpg
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── utils/
│       └── styles/
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    ├── init.sql
    ├── config/
    └── routes/
```

## 🔧 Environment Variables

All configured in `.env`:
- `DB_PASSWORD=root` (as per your PostgreSQL setup)
- `VITE_API_URL=http://192.168.0.199:5000`

## 🌐 Network Access

The application is configured to be accessible from:
- Your local machine
- Any device on your local network (192.168.0.199:1111)
- External network if port forwarding is configured

## 📊 Database

Sample data is automatically loaded on first start:
- 5 sample products
- 2 sample customers

The database persists data in a Docker volume, so your data is safe even after container restarts.

## 🛠️ Development

To run in development mode:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 🐛 Troubleshooting

**Cannot access from network:**
- Ensure Windows Firewall allows port 1111
- Check router port forwarding settings
- Verify Docker is running

**Database connection errors:**
- Wait 10-15 seconds after starting containers
- Check PostgreSQL container logs: `docker logs heypotu-db`

**Frontend not loading:**
- Clear browser cache
- Check frontend container logs: `docker logs heypotu-frontend`

## 📝 Usage Tips

1. **Products:** Always set initial stock when creating products
2. **Orders:** Stock automatically decreases when orders are created
3. **Low Stock:** Products with ≤10 remaining items show warnings
4. **Reports:** Use date filters in sales reports for specific periods
5. **Export:** All major tables can be exported to PDF and Excel

## 👥 Multi-User Access

The system supports 2-4 concurrent users safely with PostgreSQL database.

## 📄 License

Private use for Hey Potu business.

---

**Built with ❤️ for Hey Potu**
