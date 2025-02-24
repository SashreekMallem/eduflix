"use client";

import { useEffect, useState } from "react";

export default function EducationPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data or perform any setup needed for the page
    fetch("/api/education")
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Education Page</h1>
      {data ? (
        <div>
          {/* Render your data here */}
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
