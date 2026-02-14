import React, { useState } from "react";
import axios from "axios";
import { Container, Table, Modal, Button, Form } from "react-bootstrap";
import "animate.css";

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

const UserOrderHistory = () => {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = async (adNo: string): Promise<void> => {
    try {
      const response = await axios.get<Sale[]>("/api/sales");
      const userOrders = response.data.filter((order) => order.userId === adNo);
      setOrders(userOrders);
    } catch (error) {
      setError("Error fetching orders. Please try again.");
      setOrders([]);
    }
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionNumber) {
      setError("Please enter your admission number.");
      return;
    }
    setError("");
    fetchOrders(admissionNumber);
    setShowModal(false);
  };

  return (
    <Container>
      <h2 className="mb-4">Order History</h2>
      <Button variant="primary" onClick={handleShowModal} className="mb-3">
        Enter Admission Number
      </Button>
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enter Admission Number</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Admission Number</Form.Label>
              <Form.Control
                type="text"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="Enter your admission number"
              />
            </Form.Group>
            {error && <div className="text-danger mt-2">{error}</div>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            View Orders
          </Button>
        </Modal.Footer>
      </Modal>
      {orders.length > 0 ? (
        <div className="animate__animated animate__fadeIn">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.timestamp}>
                  <td>{new Date(order.timestamp).toLocaleDateString()}</td>
                  <td>
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.name} x {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>₹{order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center animate__animated animate__fadeIn orders-empty">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
            alt="No orders"
            className="orders-empty-img"
          />
          <h4 className="mt-3 orders-empty-title">
            No order history available.
          </h4>
          <p className="orders-empty-text">
            Your past orders will appear here after your first purchase!
          </p>
        </div>
      )}
    </Container>
  );
};

export default UserOrderHistory;
