import React from "react";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CartModal.css";

type CartItem = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartModalProps = {
  show: boolean;
  handleClose: () => void;
  cart: CartItem[];
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  removeFromCart: (product: CartItem) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  checkout: () => void;
};

const CartModal: React.FC<CartModalProps> = ({
  show,
  handleClose,
  cart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
  calculateTotal,
  checkout,
}) => {
  return (
    <Modal show={show} onHide={handleClose} centered className="rounded-4">
      <Modal.Header closeButton className="border-bottom-0">
        <Modal.Title className="fw-bold p-3">Cart</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {cart.map((product) => (
              <div
                key={product._id}
                className="d-flex justify-content-between align-items-center mb-3"
              >
                <div className="d-flex align-items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="img-fluid rounded-3 me-3 cart-item-image"
                  />
                  <div>
                    <h5 className="mb-0">{product.name}</h5>
                    <p className="mb-0">₹{product.price}</p>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-sm btn-outline-secondary mx-1 rounded-circle"
                    onClick={() => decrementQuantity(product._id)}
                  >
                    -
                  </button>
                  <span className="mx-2">{product.quantity}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary mx-1 rounded-circle"
                    onClick={() => incrementQuantity(product._id)}
                  >
                    +
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger mx-1 rounded-circle"
                    onClick={() => removeFromCart(product)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0">
        <h4 className="monospace fw-bold me-auto">
          Total: ₹{calculateTotal()}
        </h4>
        <Button
          variant="outline-danger"
          className="rounded-3"
          onClick={clearCart}
        >
          Clear Cart
        </Button>
        <Button variant="success" className="rounded-3" onClick={checkout}>
          Checkout
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CartModal;
