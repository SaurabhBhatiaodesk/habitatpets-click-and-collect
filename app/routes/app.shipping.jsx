import {
  Box,
  Card,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Form,
  FormLayout,
  TextField,
  Button,
  LegacyCard,
  Layout,
  Select,
  Checkbox,
  InlineStack,
  Icon,
  ButtonGroup,
  ResourceList,
  ResourceItem,
  Thumbnail,
} from "@shopify/polaris";
import { useEffect, useState, useCallback } from "react";
import { useSubmit, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
import db from "../db.server";
import NotificationBar from "../components/NotificationBar";
import { useAppBridge } from "@shopify/app-bridge-react";

export async function loader({ request }) {
  return json({
    shippingConfig: {
      conditionType: "cart-contains",
      productInCart: "product-in-cart",
      containsCondition: "contains",
      selectedProduct: "Click and Collect",
      shippingMethods: JSON.stringify([
        { id: 1, name: "Standard", enabled: true },
        { id: 2, name: "Free International Shipping", enabled: true },
        { id: 3, name: "International Shipping", enabled: true },
      ]),
    },
  });
}

export async function action({ request }) {
  const body = await request.formData();
  console.log("Form data received:", Object.fromEntries(body));
  return "success";
}

export default function ShippingCustomization() {
  const submit = useSubmit();
  const data = useLoaderData();
  const shopify = useAppBridge();
  
  const prevConfig = data?.shippingConfig;
  const [notificationMessage, setNotificationMessage] = useState("");
  
  // Form state
  const [conditionType, setConditionType] = useState(prevConfig?.conditionType || "cart-contains");
  const [productInCart, setProductInCart] = useState(prevConfig?.productInCart || "");
  const [containsCondition, setContainsCondition] = useState(prevConfig?.containsCondition || "");
  const [selectedProduct, setSelectedProduct] = useState(prevConfig?.selectedProduct || "");
  
  // Selected products state for Resource Picker
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Shipping methods state
  const [shippingMethods, setShippingMethods] = useState(
    prevConfig?.shippingMethods ? JSON.parse(prevConfig.shippingMethods) : [
      { id: 1, name: "Pickup", enabled: true },
      { id: 2, name: "Standard Shipping Melb Metro", enabled: true },
      { id: 3, name: "Click and Collect", enabled: true },
    ]
  );

  const conditionOptions = [
    { label: "Cart Contains", value: "cart-contains" },
    { label: "Cart Total", value: "cart-total" },
    { label: "Customer Tag", value: "customer-tag" },
  ];

  const productOptions = [
    { label: "product in cart", value: "product-in-cart" },
    { label: "specific product", value: "specific-product" },
    { label: "product category", value: "product-category" },
  ];

  const containsOptions = [
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "does-not-contain" },
    { label: "contains any of", value: "contains-any" },
  ];

  // Product picker handler
  const handleProductPicker = useCallback(async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: 'product',
        action: 'select',
        multiple: true,
      });
      
      if (selected) {
        setSelectedProducts(selected);
        setNotificationMessage(`${selected.length} product(s) selected successfully`);
        setTimeout(() => {
          setNotificationMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error('Product picker error:', error);
      setNotificationMessage("Error selecting products");
      setTimeout(() => {
        setNotificationMessage("");
      }, 3000);
    }
  }, [shopify]);

  const handleSubmit = useCallback(() => {
    submit({
      conditionType,
      productInCart,
      containsCondition,
      selectedProduct,
      selectedProducts: JSON.stringify(selectedProducts),
      shippingMethods: JSON.stringify(shippingMethods),
    }, { method: "post" });
    
    setNotificationMessage("Shipping configuration saved successfully");
    setTimeout(() => {
      setNotificationMessage("");
    }, 5000);
  }, [conditionType, productInCart, containsCondition, selectedProduct, selectedProducts, shippingMethods, submit]);

  const handleShippingMethodToggle = useCallback((methodId) => {
    setShippingMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, enabled: !method.enabled }
          : method
      )
    );
  }, []);

  const handleShippingMethodRename = useCallback((methodId, newName) => {
    setShippingMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, name: newName }
          : method
      )
    );
  }, []);

  const successStyle = {
    background: "#b4fed2",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
    color: "#0c5132"
  };

  return (
    <Page title="Create new customization" backAction={{url: "#"}}>
      <Layout>
        <Layout.Section>
          <LegacyCard title="Set condition to run this customization" sectioned>
            {notificationMessage !== "" && (
              <NotificationBar title={notificationMessage} style={successStyle} />
            )}
            
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <BlockStack gap="400">
                  {/* Condition Section */}
                  <Box>
                    <Text variant="headingMd" as="h3">Condition</Text>
                    <Box paddingBlockStart="200">
                      <Card sectioned>
                        <BlockStack gap="300">
                          <InlineStack align="space-between">
                            {/* <Icon source={DragHandleMinor} /> */}
                            <Box>
                              <Text variant="headingMd">Cart Contains</Text>
                              <Text variant="bodyMd" color="subdued">
                                Hide shipping methods based on the products inside the cart. It checks if the cart contains any of the products provided.
                              </Text>
                            </Box>
                            {/* <Icon source={EditMinor} /> */}
                          </InlineStack>
                          
                          <Select
                            label=""
                            options={productOptions}
                            value={productInCart}
                            onChange={setProductInCart}
                            placeholder="product in cart"
                          />
                          
                          <Select
                            label=""
                            options={containsOptions}
                            value={containsCondition}
                            onChange={setContainsCondition}
                            placeholder="contains"
                          />
                          
                          <Box>
                            <Text variant="bodyMd" fontWeight="medium">Click and Collect</Text>
                            <Button
                              variant="secondary"
                              fullWidth
                              textAlign="center"
                              onClick={handleProductPicker}
                            >
                              {selectedProducts.length > 0 
                                ? `${selectedProducts.length} product(s) selected` 
                                : "Select product"}
                            </Button>
                            
                            {/* Display selected products */}
                            {selectedProducts.length > 0 && (
                              <Box paddingBlockStart="300">
                                <Text variant="bodyMd" fontWeight="medium">Selected Products:</Text>
                                <Box paddingBlockStart="200">
                                  <ResourceList
                                    resourceName={{ singular: 'product', plural: 'products' }}
                                    items={selectedProducts}
                                    renderItem={(item) => {
                                      const { id, title, handle, images } = item;
                                      const media = images && images.length > 0 
                                        ? <Thumbnail source={images[0].originalSrc} alt={title} size="small" />
                                        : <Thumbnail source="" alt={title} size="small" />;

                                      return (
                                        <ResourceItem
                                          id={id}
                                          media={media}
                                          accessibilityLabel={`View details for ${title}`}
                                        >
                                          <Text variant="bodyMd" fontWeight="bold">
                                            {title}
                                          </Text>
                                          <Text variant="bodyMd" color="subdued">
                                            Handle: {handle}
                                          </Text>
                                        </ResourceItem>
                                      );
                                    }}
                                  />
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </BlockStack>
                      </Card>
                    </Box>
                  </Box>

                  {/* Shipping Methods Section */}
                  <Box>
                    <Text variant="headingMd" as="h3">Hide, sort or rename shipping methods</Text>
                    <Text variant="bodyMd" color="subdued">
                      Toggle the switch to hide the shipping method, drag to sort or give the shipping method a new name.
                    </Text>
                    
                    <Box paddingBlockStart="300">
                      <BlockStack gap="200">
                        {shippingMethods.map((method) => (
                          <Card key={method.id} sectioned>
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                {/* <Icon source={DragHandleMinor} /> */}
                                <Text variant="bodyMd" fontWeight="medium">
                                  {method.name}
                                </Text>
                              </InlineStack>
                              
                              <InlineStack gap="200" blockAlign="center">
                                <Checkbox
                                  checked={method.enabled}
                                  onChange={() => handleShippingMethodToggle(method.id)}
                                />
                                <ButtonGroup>
                                  <Button
                                    variant="plain"
                                    // icon={EditMinor}
                                    onClick={() => {
                                      const newName = prompt("Enter new name:", method.name);
                                      if (newName) handleShippingMethodRename(method.id, newName);
                                    }}
                                  >
                                    Rename
                                  </Button>
                                  <Button
                                    variant="plain"
                                    // icon={DeleteMinor}
                                    destructive
                                    onClick={() => {
                                      setShippingMethods(prev => 
                                        prev.filter(m => m.id !== method.id)
                                      );
                                    }}
                                  />
                                </ButtonGroup>
                              </InlineStack>
                            </InlineStack>
                          </Card>
                        ))}
                      </BlockStack>
                    </Box>
                  </Box>

                  <Button submit variant="primary">
                    Save Configuration
                  </Button>
                </BlockStack>
              </FormLayout>
            </Form>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

