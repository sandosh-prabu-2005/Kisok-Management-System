import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaShoppingCart } from "react-icons/fa";

import CartModal from "./components/CartModal/CartModal";
import ProductDetailModal from "./components/ProductDetail/ProductDetailModal";
import Footer from "./components/Footer/Footer";
import UserOrderHistory from "./components/UserOrderHistory/UserOrderHistory";

import {
  Toast,
  Form,
  InputGroup,
  Container,
  Modal,
  Button,
} from "react-bootstrap";

type Product = {
  _id: string;
  id?: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  image?: string;
  category?: string;
  ingredients?: string;
  allergens?: string;
  reason?: string;
};

type CartItem = Product & { quantity: number };

type SaleItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type Sale = {
  userId: string;
  items: SaleItem[];
  total: number;
  timestamp: number;
};

type SuggestedItem = SaleItem & { count: number; image: string };

type FeedbackForm = {
  name: string;
  admissionNumber: string;
  message: string;
};

const ShoppingCartIcon = FaShoppingCart as unknown as React.ComponentType<
  React.SVGProps<SVGSVGElement>
>;

const App = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showCheckoutToast, setShowCheckoutToast] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [userId, setUserId] = useState("");
  const [showMenuPage, setShowMenuPage] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackForm>({
    name: "",
    admissionNumber: "",
    message: "",
  });
  const [feedbackStatus, setFeedbackStatus] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get<Product[]>("/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const url = userId
          ? `/api/recommendations?userId=${encodeURIComponent(userId)}`
          : "/api/recommendations";
        const res = await axios.get<{ all?: Product[] }>(url);
        setRecommendations(res.data.all || []);
      } catch (err) {
        setRecommendations([]);
      }
    };
    fetchRecommendations();
  }, [userId]);

  const addToCart = async (productId: string): Promise<void> => {
    try {
      const { data: product } = await axios.get<Product>(
        `/api/products/${productId}`
      );
      if (!product || product.quantity <= 0) return;
      setCart((prev) => {
        const exists = prev.find((p) => p._id === product._id);
        if (exists) {
          return prev.map((p) =>
            p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      await axios.post("/api/products/update-quantity", {
        id: product._id,
        quantityChange: -1,
      });
      setShowCartModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to add product to cart.");
    }
  };

  const incrementQuantity = (productId: string) =>
    setCart((prev) =>
      prev.map((p) =>
        p._id === productId ? { ...p, quantity: p.quantity + 1 } : p
      )
    );

  const decrementQuantity = (productId: string) =>
    setCart((prev) =>
      prev.map((p) =>
        p._id === productId && p.quantity > 1
          ? { ...p, quantity: p.quantity - 1 }
          : p
      )
    );

  const removeFromCart = (prod: CartItem) =>
    setCart((prev) => prev.filter((p) => p._id !== prod._id));

  const clearCart = () => setCart([]);

  const calculateTotal = () =>
    cart.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const checkout = () => {
    setShowCartModal(false);
    setShowAdmissionModal(true);
  };

  // Fetch and analyze user order history for suggestions
  const fetchUserSuggestions = async (adNo: string): Promise<void> => {
    try {
      const response = await axios.get<Sale[]>("/api/sales");
      const userOrders = response.data.filter((order) => order.userId === adNo);
      // Count item purchases
      const itemCounts: Record<string, SuggestedItem> = {};
      userOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (!itemCounts[item.id]) {
            itemCounts[item.id] = { ...item, count: 0, image: "" };
          }
          itemCounts[item.id].count += item.quantity;
        });
      });
      // Merge image from products list
      const merged = Object.values(itemCounts).map((item) => {
        const prod = products.find(
          (p) => p._id === item.id || p.id === item.id
        );
        return {
          ...item,
          image: prod
            ? prod.image
            : "https://via.placeholder.com/36?text=No+Img",
        };
      });
      // Sort by most purchased
      const sorted = merged.sort((a, b) => b.count - a.count);
      setSuggestedItems(sorted.slice(0, 5)); // Top 5 suggestions
    } catch (err) {
      setSuggestedItems([]);
    }
  };

  const handleAdmissionConfirm = async (): Promise<void> => {
    if (!admissionNumber) {
      setCheckoutError("Please enter your admission number.");
      return;
    }
    setShowAdmissionModal(false);
    setCheckoutError("");
    // Fetch suggestions for this user
    fetchUserSuggestions(admissionNumber);
    // Prepare sale data
    const saleData: Sale = {
      userId: admissionNumber,
      items: cart.map((i) => ({
        id: i._id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      total: calculateTotal(),
      timestamp: Date.now(),
    };
    try {
      await axios.post("/api/sales", saleData);
      // Build PDF
      if (cart.length > 0) {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Kiosk Vending Machine Invoice", 14, 22);
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Admission Number: ${admissionNumber}`, 14, 36);
        const columns = ["Item", "Qty", "Price", "Subtotal"];
        const rows = cart.map((item) => [
          item.name,
          item.quantity.toString(),
          `Rs: ${Number(item.price).toFixed(2)}`,
          `Rs: ${(Number(item.price) * item.quantity).toFixed(2)}`,
        ]);
        autoTable(doc, {
          head: [columns],
          body: rows,
          startY: 45,
        });
        const finalY = (doc as any).lastAutoTable
          ? (doc as any).lastAutoTable.finalY
          : 45;
        doc.setFontSize(14);
        doc.text(
          `Total Amount\nRs: ${calculateTotal().toFixed(2)}`,
          14,
          finalY + 10
        );
        doc.save(`invoice_${Date.now()}.pdf`);
      }
      clearCart();
      setShowReceiptModal(true);
      setShowCheckoutToast(true);
      setTimeout(() => setShowCheckoutToast(false), 3000);
      // Refetch products to update quantities after purchase
      try {
        const response = await axios.get<Product[]>("/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products after purchase:", error);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setCheckoutError("Checkout failed. Please try again.");
    }
  };



  // Floating cart button handler
  const handleFloatingCartClick = () => setShowCartModal(true);

  // Helper to highlight matching text
  function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <span className="highlight-match">
          {text.substring(idx, idx + query.length)}
        </span>
        {text.substring(idx + query.length)}
      </>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Container className="d-flex flex-column align-items-center my-3 py-3">
        <div className="d-flex align-items-center w-100 mb-2 brand-row">
          <img
            src={process.env.PUBLIC_URL + "/mepco-logo.png"}
            alt="Mepco College Logo"
            className="brand-logo"
          />
          <h1
            className="fw-bold mb-0 brand-title"
          >
            <Link
              to="/"
              className="text-decoration-none text-dark App-link"
              onClick={() => {
                setShowOrderHistory(false);
                setShowMenuPage(false);
              }}
            >
              Kiosk Vending Machine{" "}
              <span className="brand-dept">
                | CSE Department
              </span>
            </Link>
          </h1>
        </div>
        <div className="d-flex justify-content-center position-relative nav-btn-group">
          <button
            onClick={() => {
              setShowOrderHistory(false);
              setShowMenuPage(false);
            }}
            className="btn nav-btn nav-btn-primary"
          >
            Home
          </button>
          <button
            className="btn nav-btn nav-btn-primary"
            onClick={() => {
              setShowMenuPage(true);
              setShowOrderHistory(false);
            }}
          >
            Menu
          </button>
          <button
            onClick={() => {
              setShowOrderHistory(true);
              setShowMenuPage(false);
            }}
            className="btn nav-btn nav-btn-primary"
          >
            My Orders
          </button>
          <button
            className="btn nav-btn nav-btn-primary"
            onClick={() => setShowFeedbackModal(true)}
          >
            Feedback
          </button>
        </div>
      </Container>
      <Container className="mt-5 flex-grow-1 app-main">
        {checkoutError && (
          <Toast
            show
            bg="danger"
            className="position-fixed top-0 end-0 m-3"
            onClose={() => setCheckoutError("")}
          >
            <Toast.Body>{checkoutError}</Toast.Body>
          </Toast>
        )}
        {showOrderHistory ? (
          <UserOrderHistory />
        ) : showMenuPage ? (
          // MENU PAGE: Today's Items and search bar
          <div className="menu-grid-container">
            <h2 className="fw-bold mb-4 section-title">
              Today's Items
            </h2>
            <div className="menu-search-row">
              <Form.Group
                className="w-100 w-md-50 my-auto menu-search-group"
              >
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() =>
                      setTimeout(() => setSearchFocused(false), 150)
                    }
                    onKeyDown={(e) => {
                      if (!searchFocused) return;
                      const filteredSuggestions = searchTerm.trim()
                        ? suggestedItems.filter((item) =>
                            item.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          )
                        : suggestedItems;
                      if (filteredSuggestions.length === 0) return;
                      if (e.key === "ArrowDown") {
                        setHighlightedIndex(
                          (prev) => (prev + 1) % filteredSuggestions.length
                        );
                        e.preventDefault();
                      } else if (e.key === "ArrowUp") {
                        setHighlightedIndex(
                          (prev) =>
                            (prev - 1 + filteredSuggestions.length) %
                            filteredSuggestions.length
                        );
                        e.preventDefault();
                      } else if (e.key === "Enter" && highlightedIndex >= 0) {
                        setSearchTerm(
                          filteredSuggestions[highlightedIndex].name
                        );
                        setHighlightedIndex(-1);
                        setSearchFocused(false);
                        e.preventDefault();
                      }
                    }}
                    autoComplete="off"
                  />
                </InputGroup>
                {searchFocused &&
                  suggestedItems.length > 0 &&
                  (() => {
                    const filteredSuggestions = searchTerm.trim()
                      ? suggestedItems.filter((item) =>
                          item.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                      : suggestedItems;
                    if (filteredSuggestions.length === 0) return null;
                    return (
                      <div className="suggestions-panel">
                        <div className="suggestions-header">
                          Suggestions for you
                        </div>
                        {filteredSuggestions.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`suggestion-item ${
                              highlightedIndex === idx ? "active" : ""
                            }`}
                            onMouseDown={() => setSearchTerm(item.name)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="suggestion-image"
                            />
                            <span className="suggestion-name">
                              {highlightMatch(item.name, searchTerm)}
                            </span>
                            <span
                              className={`suggestion-count ${
                                highlightedIndex === idx ? "active" : ""
                              }`}
                            >
                              ({item.count}x)
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
              </Form.Group>
            </div>
            <div className="menu-grid">
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                  <div key={product._id} className="menu-grid-item">
                    <div className="card h-100 rounded-4 shadow-sm menu-card">
                      <img
                        src={product.image}
                        className="card-img-top rounded-top-4 product-image menu-card-img"
                        alt={product.name}
                      />
                      <div className="card-body d-flex flex-column menu-card-body">
                        <h5 className="card-title fw-bold">{product.name}</h5>
                        <p className="card-text">
                          <strong>Price:</strong> ₹{product.price}
                        </p>
                        <p className="card-text">
                          <strong>Quantity:</strong> {product.quantity}
                        </p>
                        <div className="mt-auto">
                          <button
                            className="btn btn-primary rounded-3 w-100"
                            onClick={() => addToCart(product._id)}
                            disabled={product.quantity === 0}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          // Home page: only show recommendations and about college info
          <>
            {recommendations.length > 0 && (
              <div className="mb-5">
                <h2 className="fw-bold mb-3 section-title">
                  Recommended for you
                </h2>
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                  {recommendations.map((product) => (
                    <div key={product._id} className="col">
                      <div className="card h-100 rounded-4 shadow-sm">
                        <img
                          src={product.image}
                          className="card-img-top rounded-top-4 product-image"
                          alt={product.name}
                        />
                        <div className="card-body d-flex flex-column">
                          <h5 className="card-title fw-bold">{product.name}</h5>
                          <p className="card-text">
                            <strong>Price:</strong> ₹{product.price}
                          </p>
                          <p className="card-text">
                            <strong>Quantity:</strong> {product.quantity}
                          </p>
                          {product.reason && (
                            <div className="alert alert-info p-2 mt-2 mb-0 recommendation-reason">
                              <strong>Why?</strong> {product.reason}
                            </div>
                          )}
                          <div className="mt-auto">
                            <button
                              className="btn btn-primary rounded-3 w-100"
                              onClick={() => addToCart(product._id)}
                              disabled={product.quantity === 0}
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* About College Section */}
            <div className="mb-5 p-4 glass about-college-section position-relative">
              <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-3">
                <img
                  src={process.env.PUBLIC_URL + "/mepco-logo.png"}
                  alt="Mepco College Logo"
                  className="about-logo"
                />
                <div>
                  <h2
                    className="fw-bold mb-1 about-title"
                  >
                    About Mepco Schlenk Engineering College
                  </h2>
                  <div className="d-flex gap-4 mt-2 flex-wrap">
                    <Counter label="Years of Excellence" value={40} />
                    <Counter label="Students" value={4000} />
                    <Counter label="Placements" value={50000} />
                  </div>
                </div>
              </div>
              <p className="about-description">
                Mepco Schlenk Engineering College, Sivakasi, is a premier
                institution in Tamil Nadu, India, known for its academic
                excellence, vibrant campus life, and commitment to innovation.
                The college offers a wide range of undergraduate and
                postgraduate programs in engineering, technology, and
                management, and is recognized for its state-of-the-art
                facilities, experienced faculty, and strong industry
                connections. Mepco fosters holistic development, research, and
                entrepreneurship, making it a top choice for aspiring engineers
                and technologists.
              </p>
              <LearnMoreSection />
              <CollegeCarousel />
            </div>
          </>
        )}
        <CartModal
          show={showCartModal}
          handleClose={() => setShowCartModal(false)}
          cart={cart}
          incrementQuantity={incrementQuantity}
          decrementQuantity={decrementQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          calculateTotal={calculateTotal}
          checkout={checkout}
        />
        <ProductDetailModal
          show={showProductDetailModal}
          handleClose={() => setShowProductDetailModal(false)}
          product={null}
          addToCart={addToCart}
        />
        {/* Admission Number Modal */}
        <Modal
          show={showAdmissionModal}
          onHide={() => setShowAdmissionModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Enter Admission Number</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Admission Number</Form.Label>
              <Form.Control
                type="text"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="Enter your admission number"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAdmissionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleAdmissionConfirm();
                setUserId(admissionNumber);
              }}
            >
              Confirm Payment
            </Button>
          </Modal.Footer>
        </Modal>
        {/* Receipt Modal */}
        <Modal
          show={showReceiptModal}
          onHide={() => setShowReceiptModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Payment Successful</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Your order has been placed successfully!</p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => setShowReceiptModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        {/* Feedback Modal */}
        <Modal
          show={showFeedbackModal}
          onHide={() => setShowFeedbackModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Submit Feedback</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={feedback.name}
                  onChange={(e) =>
                    setFeedback({ ...feedback, name: e.target.value })
                  }
                  placeholder="Enter your name"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Admission Number</Form.Label>
                <Form.Control
                  type="text"
                  value={feedback.admissionNumber}
                  onChange={(e) =>
                    setFeedback({ ...feedback, admissionNumber: e.target.value })
                  }
                  placeholder="Enter your admission number"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Feedback</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={feedback.message}
                  onChange={(e) =>
                    setFeedback({ ...feedback, message: e.target.value })
                  }
                  placeholder="Enter your feedback"
                />
              </Form.Group>
              {feedbackStatus && (
                <div
                  className={`alert ${
                    feedbackStatus.includes("success")
                      ? "alert-success"
                      : "alert-danger"
                  }`}
                >
                  {feedbackStatus}
                </div>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowFeedbackModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                setFeedbackStatus("");
                if (!feedback.name || !feedback.admissionNumber || !feedback.message) {
                  setFeedbackStatus("All fields are required.");
                  return;
                }
                try {
                  await axios.post("/api/feedback", feedback);
                  setFeedbackStatus("Feedback submitted successfully!");
                  setFeedback({ name: "", admissionNumber: "", message: "" });
                } catch (err) {
                  setFeedbackStatus("Failed to submit feedback.");
                }
              }}
            >
              Submit
            </Button>
          </Modal.Footer>
        </Modal>
        <Toast
          show={showCheckoutToast}
          delay={3000}
          autohide
          className="position-fixed bottom-0 end-0 m-3"
        >
          <Toast.Body>Checkout successful!</Toast.Body>
        </Toast>
        {/* Floating Cart Button */}
        {cart.length > 0 && !showCartModal && (
          <button
            className="floating-cart-btn animate__animated animate__bounceIn"
            onClick={handleFloatingCartClick}
            aria-label="View Cart"
          >
            <ShoppingCartIcon />
            <span className="floating-cart-count">{cart.length}</span>
          </button>
        )}
      </Container>
      <Footer />
    </div>
  );
};

// Animated Counter component
const Counter = ({ label, value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    let incrementTime = 20;
    let step = Math.ceil(end / 50);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div className="text-center counter-box">
      <div className="counter-value">
        {count.toLocaleString()}
      </div>
      <div className="counter-label">
        {label}
      </div>
    </div>
  );
};

// Learn More expandable section
const LearnMoreSection = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-3">
      <button
        className="btn btn-outline-primary btn-sm mb-2 learn-more-btn"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide Details" : "Learn More"}
      </button>
      {expanded && (
        <div className="p-3 rounded-4 learn-more-panel">
          <ul className="learn-more-list">
            <li>NBA & NAAC accredited programs</li>
            <li>Strong placement record with top MNCs</li>
            <li>Active research and innovation centers</li>
            <li>Vibrant student clubs and technical societies</li>
            <li>Beautiful, green, Wi-Fi enabled campus</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Simple College Highlights Carousel
const CollegeCarousel = () => {
  const highlights = [
    { img: process.env.PUBLIC_URL + "/mepco-logo.png", caption: "Proud Heritage" },
    { img: "https://www.mepcoeng.ac.in/images/gallery/infra/infra1.jpg", caption: "Modern Infrastructure" },
    { img: "https://www.mepcoeng.ac.in/images/gallery/placement/placement1.jpg", caption: "Excellent Placements" },
    { img: "https://www.mepcoeng.ac.in/images/gallery/campus/campus1.jpg", caption: "Green Campus" },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % highlights.length), 3500);
    return () => clearInterval(timer);
  }, [highlights.length]);
  return (
    <div className="mt-4 d-flex flex-column align-items-center">
      <div className="rounded-4 shadow-sm mb-2 carousel-card">
        <img
          src={highlights[idx].img}
          alt={highlights[idx].caption}
          className="carousel-image"
        />
      </div>
      <div className="carousel-caption">{highlights[idx].caption}</div>
      <div className="d-flex gap-2 mt-1">
        {highlights.map((_, i) => (
          <span
            key={i}
            className={`carousel-dot ${idx === i ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
