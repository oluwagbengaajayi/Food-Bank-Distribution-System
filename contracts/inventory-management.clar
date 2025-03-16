;; Inventory Management Contract
;; Monitors available supplies and expiration dates

;; Define error codes
(define-constant ERR_UNAUTHORIZED u100)
(define-constant ERR_INVALID_PARAMS u101)
(define-constant ERR_NOT_FOUND u102)

;; Define data structure for inventory items
(define-map inventory
  {item-id: uint}
  {
    food-type: (string-utf8 30),
    quantity: uint,
    expiration-date: uint,
    donation-id: uint,
    available: bool
  }
)

;; Track inventory count
(define-data-var inventory-count uint u0)

;; Principal for authorized administrators
(define-data-var admin principal tx-sender)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Add item to inventory (called from donation-tracking contract)
(define-public (add-inventory-item
                (food-type (string-utf8 30))
                (quantity uint)
                (expiration-date uint)
                (donation-id uint))
  (let ((item-id (+ (var-get inventory-count) u1)))
    (map-set inventory
             {item-id: item-id}
             {
               food-type: food-type,
               quantity: quantity,
               expiration-date: expiration-date,
               donation-id: donation-id,
               available: true
             })
    (var-set inventory-count item-id)
    (ok item-id)))

;; Update inventory item quantity
(define-public (update-quantity (item-id uint) (new-quantity uint))
  (let ((item (map-get? inventory {item-id: item-id})))
    (if (is-admin)
        (if (is-some item)
            (begin
              (map-set inventory
                       {item-id: item-id}
                       (merge (unwrap-panic item) {quantity: new-quantity}))
              (ok true))
            (err ERR_NOT_FOUND))
        (err ERR_UNAUTHORIZED))))

;; Mark inventory as unavailable (e.g., allocated or expired)
(define-public (mark-unavailable (item-id uint))
  (let ((item (map-get? inventory {item-id: item-id})))
    (if (is-admin)
        (if (is-some item)
            (begin
              (map-set inventory
                       {item-id: item-id}
                       (merge (unwrap-panic item) {available: false}))
              (ok true))
            (err ERR_NOT_FOUND))
        (err ERR_UNAUTHORIZED))))

;; Get inventory item details
(define-read-only (get-inventory-item (item-id uint))
  (map-get? inventory {item-id: item-id}))

;; Get total inventory count
(define-read-only (get-inventory-count)
  (var-get inventory-count))

