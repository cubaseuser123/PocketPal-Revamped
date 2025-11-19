import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// -----------------------------------------
// JSON STORE HELPERS
// -----------------------------------------
function readStore() {
  return JSON.parse(fs.readFileSync("./store.json", "utf-8"));
}

function writeStore(data) {
  fs.writeFileSync("./store.json", JSON.stringify(data, null, 2));
}

// -----------------------------------------
// AUTH TOKEN
// -----------------------------------------
async function getAuthToken() {
  const response = await axios.post(
    process.env.AUTH_URL,
    {
      clientId: process.env.CLIENT_ID,
      secret: process.env.CLIENT_SECRET,
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

// -----------------------------------------
// CREATE CONSENT
// -----------------------------------------
export async function createConsent() {
  const token = await getAuthToken();

  const response = await axios.post(
    process.env.SANDBOX_URL,
    {
      consentDuration: { unit: "MONTH", value: "24" },
      vua: "9860915237@onemoney",
      dataRange: {
        from: "2023-01-01T00:00:00Z",
        to: "2025-01-24T00:00:00Z",
      },
      consentTypes: ["PROFILE", "TRANSACTIONS"],
      context: [],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-product-instance-id": process.env.PRODUCT_INSTANCE_ID,
        "Content-Type": "application/json",
      },
    },
  );

  const store = readStore();
  store.consentId = response.data.id;
  writeStore(store);

  console.log("✔ Consent Created:", response.data.id);

  return response.data;
}

// -----------------------------------------
// GET CONSENT
// -----------------------------------------
export async function getConsent() {
  const token = await getAuthToken();
  const store = readStore();

  const response = await axios.get(
    `${process.env.SANDBOX_URL}/${store.consentId}`,
    {
      params: { expanded: true },
      headers: {
        Authorization: `Bearer ${token}`,
        "x-product-instance-id": process.env.PRODUCT_INSTANCE_ID,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("✔ Consent Retrieved:", response.data);
  return response.data;
}

// -----------------------------------------
// CREATE FI DATA SESSION
// -----------------------------------------
export async function createFIDataFetch() {
  const token = await getAuthToken();
  const store = readStore();

  const response = await axios.post(
    "https://fiu-sandbox.setu.co/v2/sessions",
    {
      consentId: store.consentId,
      format: "json",
      dataRange: {
        from: "2023-01-01T00:00:00Z",
        to: "2025-01-24T00:00:00Z",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-product-instance-id": process.env.PRODUCT_INSTANCE_ID,
        "Content-Type": "application/json",
      },
    },
  );

  store.sessionId = response.data.sessionId;
  writeStore(store);

  console.log("✔ Session Created:", response.data.sessionId);

  return response.data;
}

// -----------------------------------------
// GET FI DATA FROM SESSION
// -----------------------------------------
export async function getFIData() {
  const token = await getAuthToken();
  const store = readStore();

  const response = await axios.get(
    `https://fiu-sandbox.setu.co/v2/sessions/${store.sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-product-instance-id": process.env.PRODUCT_INSTANCE_ID,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("✔ FI Data:", response.data);
  return response.data;
}

// ----------------------------------------------------
// RUN ANY FUNCTION YOU WANT BY COMMENTING/UNCOMMENTING
// ----------------------------------------------------

// createConsent();
// getConsent();
// createFIDataFetch();
// getFIData();
