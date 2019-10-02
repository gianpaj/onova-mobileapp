```mermaid
graph TD;

%% Product.js

    Buyer((Buyer)) -.->|press buy on Product|ProductAvailable{Product is Available?} %% (`forsale` and quantity > 0)
%%    Product --> Shared{Has Been Shared?}
%%    Shared -->|No| NotShared{"Show Prompt: <br/>'Invite your friends to chat on Onova' (Ok or Cancel)"}
%%    NotShared -->|Ok| A["send API call to server say saying that <br/> it has been shared (increaseShare)"]
%%    Shared -->|Yes| ProductAvailable{Product is Available?} %% (`forsale` and quantity > 0)
    ProductAvailable -->|No| B[Show message:<br/>'This item is not longer for sale']
    ProductAvailable -->|Yes| C[Go to Checkout]
    Checkout -->|Create Order| Order{Existing Order?}
    Order -->|Yes| ExistingOrder[Get existing order info]
    Order -->|No| NewOrder[New Order]
    NewOrder -->|Fill Checkout info| CheckoutFilled
    Order -->|Fill Checkout info| CheckoutFilled
    
```



1. We don't know for sure on Android, but on iOS yes (react-native Share component).
2. (for older accounts) If the seller didn't enter Payment details and Shipping Info, the server will return an error saying 'Seller is missing payment or shipping info' (not translated)