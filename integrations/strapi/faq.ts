const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL;

async function getPosts() {
    try {
      const response = await fetch(`${STRAPI_URL}/api/faqs?populate=*`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Fetched posts:", data);
      return data;
    } catch (error) {
      console.error("Error fetching posts:", error);
      return null;
    }
  }
  