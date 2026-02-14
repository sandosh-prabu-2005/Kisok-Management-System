import React from "react";
import { Modal } from "react-bootstrap";

type Product = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  category?: string;
  ingredients?: string;
  allergens?: string;
};

type ProductDetailModalProps = {
  show: boolean;
  handleClose: () => void;
  product: Product | null;
  addToCart: (productId: string) => void;
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  show,
  handleClose,
  product,
  addToCart,
}) => {
  if (!product) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton></Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <img
            src={product.image}
            alt={product.name}
            className="img-fluid rounded product-detail-image"
          />
        </div>
        <div className="d-flex flex-column gap-3">
          <div>
            <h2 className="fw-bold mb-3">{product.name}</h2>
            {product.category && (
              <p className="mb-2">
                <strong>Category:</strong> <span className="badge bg-info">{product.category}</span>
              </p>
            )}
          </div>

          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Price:</strong> <span className="text-success fw-bold fs-5">₹{product.price}</span>
              </p>
              <p className="mb-2">
                <strong>Stock Available:</strong> {product.quantity > 0 ? (
                  <span className="text-success fw-bold">{product.quantity} units</span>
                ) : (
                  <span className="text-danger fw-bold">Out of Stock</span>
                )}
              </p>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-primary rounded-3 w-100 fw-bold product-detail-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product._id);
                  handleClose();
                }}
                disabled={product.quantity === 0}
              >
                {product.quantity === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>

          <div className="card border-light">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-2">Description:</h5>
              <p className="card-text">{product.description || "No description available."}</p>
            </div>
          </div>

          {product.ingredients && (
            <div className="card border-light">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-2">Ingredients:</h5>
                <p className="card-text">{product.ingredients}</p>
              </div>
            </div>
          )}

          {product.allergens && (
            <div className="card border-warning">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-2">
                  ⚠️ Allergens:
                </h5>
                <p className="card-text text-danger fw-bold">{product.allergens}</p>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductDetailModal;
