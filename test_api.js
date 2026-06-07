const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/flights/book', {
      traceId: "test",
      resultIndex: "1",
      isLCC: true,
      passengers: [{ FirstName: "Alis", LastName: "Patel", Gender: 1, Title: "Mr" }],
      contactDetails: { Email: "alispatel123098@gmail.com", ContactNo: "8511231514" },
      userId: 1
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}
test();
