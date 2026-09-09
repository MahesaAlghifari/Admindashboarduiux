const API_BASE_URL = import.meta.env.DEV
  ? "/backend"
  : "https://ssphereapigateway.ibik.cloud";

export default API_BASE_URL;