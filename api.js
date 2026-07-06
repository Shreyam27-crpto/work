const API_BASE_URL = "https://demohotelsapi.pythonanywhere.com/hotels/";

export const CITIES = [
  "Ahmedabad",
  "Bengaluru",
  "Chennai",
  "Delhi",
  "Goa",
  "Gurgaon",
  "Hyderabad",
  "Jaipur",
  "Kolkata",
  "Mumbai",
  "Noida",
  "Pune",
];

export async function fetchHotels(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value).trim());
    }
  });

  const url = `${API_BASE_URL}${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`The hotel API returned ${response.status}.`);
  }

  const payload = await response.json();

  return {
    status: payload.status,
    count: Number(payload.count ?? 0),
    returned: Number(payload.returned ?? payload.data?.length ?? 0),
    message: payload.message ?? "Hotels loaded",
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}
