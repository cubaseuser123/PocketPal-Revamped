import axios from "axios";

const API_URL = "http://localhost:5757/api/auth";
let token = null;

async function testAuth() {
  try {
    console.log("🧪 Testing Auth Package...\n");

    // 1. Register
    console.log("1️⃣  Testing Register...");
    const email = `test${Date.now()}@example.com`;
    const registerRes = await axios.post(`${API_URL}/register`, {
      name: "Test User",
      email: email,
      password: "password123",
    });
    console.log("✅ Register Success:", registerRes.data);

    // 2. Login
    console.log("\n2️⃣  Testing Login...");
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: email,
      password: "password123",
    });
    token = loginRes.data.token;
    console.log("✅ Login Success");
    console.log("Token:", token);
    console.log("User:", loginRes.data.user);

    // 3. Get Me
    console.log("\n3️⃣  Testing Get Me...");
    const meRes = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Get Me Success:", meRes.data);

    // 4. Logout
    console.log("\n4️⃣  Testing Logout...");
    const logoutRes = await axios.post(
      `${API_URL}/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log("✅ Logout Success:", logoutRes.data);

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("\n⚠️  Make sure your backend is running on port 5757");
    }
  }
}

testAuth();
