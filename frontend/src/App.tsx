import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { useCartStore } from './stores/useCartStore';

// Layouts
import { ConsumerLayout } from './components/layout/ConsumerLayout';
import { VendorLayout } from './components/layout/VendorLayout';
import { SupportLayout } from './components/layout/SupportLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Consumer Pages
import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { CustomerSupportPage } from './pages/CustomerSupportPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { BlogPage } from './pages/BlogPage';
import { AuthPage } from './pages/AuthPage';

// Vendor Pages
import { VendorOverviewPage } from './pages/VendorOverviewPage';
import { VendorStatisticsPage } from './pages/VendorStatisticsPage';
import { VendorProductsPage } from './pages/VendorProductsPage';
import { VendorProductFormPage } from './pages/VendorProductFormPage';
import { VendorOrdersPage } from './pages/VendorOrdersPage';
import { VendorCustomersPage } from './pages/VendorCustomersPage';
import { VendorConversationsPage } from './pages/VendorConversationsPage';
import { VendorAIAgentPage } from './pages/VendorAIAgentPage';
import { VendorProfilePage } from './pages/VendorProfilePage';
import { VendorSettingsPage } from './pages/VendorSettingsPage';
import { VendorSupportPage } from './pages/VendorSupportPage';

// Support & Admin Pages
import { SupportDashboardPage } from './pages/SupportDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { fetchMe, user } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    void fetchMe();
  }, []);

  useEffect(() => {
    void fetchCart();
  }, [user?.uid]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Default Landing */}
        <Route path="/" element={<Navigate to="/shop" replace />} />

        {/* Consumer Marketplace */}
        <Route element={<ConsumerLayout />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/shop" element={<HomePage />} />
          <Route path="/shop/about" element={<AboutUsPage />} />
          <Route path="/shop/blog" element={<BlogPage />} />
          <Route path="/shop/products" element={<ProductListingPage />} />
          <Route path="/shop/products/:productId" element={<ProductDetailPage />} />
          <Route path="/shop/cart" element={<CartPage />} />
          <Route path="/shop/checkout" element={<CheckoutPage />} />
          <Route path="/shop/orders" element={<OrdersPage />} />
          <Route path="/shop/wishlist" element={<WishlistPage />} />
          <Route path="/shop/profile" element={<ProfilePage />} />
          <Route path="/shop/support" element={<CustomerSupportPage />} />
        </Route>

        {/* Vendor Dashboard (3-Column Layout with Persistent Customer Chat) */}
        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<VendorOverviewPage />} />
          <Route path="statistics" element={<VendorStatisticsPage />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="products/new" element={<VendorProductFormPage />} />
          <Route path="products/:productId/edit" element={<VendorProductFormPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="customers" element={<VendorCustomersPage />} />
          <Route path="conversations" element={<VendorConversationsPage />} />
          <Route path="ai-agent" element={<VendorAIAgentPage />} />
          <Route path="profile" element={<VendorProfilePage />} />
          <Route path="settings" element={<VendorSettingsPage />} />
          <Route path="support" element={<VendorSupportPage />} />
        </Route>

        {/* Support Agent Workspace */}
        <Route path="/support" element={<SupportLayout />}>
          <Route index element={<SupportDashboardPage />} />
        </Route>

        {/* Admin Governance Console */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
