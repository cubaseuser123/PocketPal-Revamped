import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function getAuthToken() {
  const authUrl = `${process.env.AUTH_URL}`;

  const response = await axios.post(
    authUrl,
    {
      clientId: `${process.env.CLIENT_ID}`,
      secret: `${process.env.CLIENT_SECRET}`,
      grant_type: "client_credentials",
    },
    {
      headers: {
        client: "bridge",
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.access_token;
}

async function createConsent() {
  const token = await getAuthToken();

  const url = `${process.env.SANDBOX_URL}`;

  const options = {
    method: "POST",
    url: url,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-product-instance-id": `${process.env.PRODUCT_INSTANCE_ID}`,
      "Content-Type": "application/json",
    },
    data: {
      consentDuration: { unit: "MONTH", value: "24" },
      vua: "9999999999@onemoney",
      dataRange: {
        from: "2023-01-01T00:00:00Z",
        to: "2025-01-24T00:00:00Z",
      },
      consentTypes: ["PROFILE", "TRANSACTIONS"],
      context: [],
    },
  };

  const response = await axios.request(options);
  console.log("Consent Response:", response.data);
}

createConsent().catch(console.error);
