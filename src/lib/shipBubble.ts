// import dotenv from "dotenv";
// import axios from "axios";
// import dayjs from "dayjs";
// dotenv.config();

// interface ShipBubbleAddressFomart {
//   name: string;
//   email: string;
//   phone: string;
//   address: string; // "62 Old yaba road, Yaba, Lagos, Nigeria"
// }

// interface PackageItem {
//   name: string;
//   description: string;
//   unit_weight: string; // in KG
//   unit_amount: string; // in currency
//   quantity: string;
// }

// interface Package {
//   category_id: number;
//   package_items: PackageItem[];
//   package_dimension: {
//     length: number;
//     width: number;
//     height: number;
//   };
// }

// interface ValidateAddressResponse {
//   status: string;
//   message: string;
//   data: {
//     address_code: number;
//     address: string;
//     name: string;
//     email: string;
//     street_no: string; // this was returned as a string
//     street: string;
//     phone: string;
//     formatted_address: string;
//     country: "Nigeria";
//     country_code: "NG";
//     city: string;
//     city_code: string;
//     state: string;
//     state_code: string;
//     postal_code: string;
//     latitude: number;
//     longitude: number;
//   };
// }

// const SHIPBUBBLE_API_URL = process.env.SHIPBUBBLE_API_URL;
// const API_KEY = process.env.SHIPBUBBLE_API_KEY;

// const validateAddress = async (address: ShipBubbleAddressFomart) => {
//   try {
//     const response = await axios.post<ValidateAddressResponse>(
//       `${SHIPBUBBLE_API_URL}/shipping/address/validate`,
//       address,
//       {
//         headers: {
//           Authorization: `Bearer ${API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return response.data.data.address_code;
//   } catch (error: any) {
//     throw new Error(
//       `Address validation failed: ${
//         error.response?.data?.message || error.message
//       }`
//     );
//   }
// };

// const fetchCategories = async () => {
//   try {
//     const response = await axios.get(
//       `${SHIPBUBBLE_API_URL}/shipping/labels/categories`,
//       {
//         headers: {
//           Authorization: `Bearer ${API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("Available Categories:", response.data);
//   } catch (error) {
//     throw new Error(`Error fetching categories: ${error}`);
//   }
// };

// export const getBestShippingOption = async (
//   shipFrom: ShipBubbleAddressFomart,
//   shipTo: ShipBubbleAddressFomart,
//   packageDetails: Package
// ) => {
//   try {
//     const senderAddressCode = await validateAddress(shipFrom);
//     const receiverAddressCode = await validateAddress(shipTo);

//     const payload = {
//       sender_address_code: senderAddressCode,
//       reciever_address_code: receiverAddressCode,
//       pickup_date: dayjs().format("YYYY-MM-DD"), // Today's date
//       category_id: packageDetails.category_id,
//       package_items: packageDetails.package_items,
//       package_dimension: packageDetails.package_dimension,
//     };

//     const response = await axios.post(
//       `${SHIPBUBBLE_API_URL}/shipping/fetch_rates`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const rates = response.data;
//     console.log("rates response", rates);

//     return rates;
//   } catch (error: any) {
//     throw new Error(
//       `Error getting rates: ${error.response?.data?.message || error.message}`
//     );
//   }
// };

// // Example Usage
// const from: ShipBubbleAddressFomart = {
//   name: "Vicky kizito",
//   email: "sender@example.com",
//   phone: "09133349393",
//   address: "C5 woodland court, dpkay estate, orchid road, Epe, Lagos, Nigeria",
// };

// const to: ShipBubbleAddressFomart = {
//   name: "Emmanuel ofoneta",
//   email: "receiver@example.com",
//   phone: "09133349394",
//   address: "62 Old yaba road, Yaba, Lagos, Nigeria",
// };

// const packageDetails: Package = {
//   category_id: 99652979, // Health and beauty
//   package_items: [
//     {
//       name: "Jameson Whiskey",
//       description: "Too sweet",
//       unit_weight: "0.002",
//       unit_amount: "5000",
//       quantity: "2",
//     },
//   ],
//   package_dimension: {
//     length: 12,
//     width: 10,
//     height: 10,
//   },
// };

// const shipResponse = getBestShippingOption(from, to, packageDetails);

// console.log("shipResponse", shipResponse);
