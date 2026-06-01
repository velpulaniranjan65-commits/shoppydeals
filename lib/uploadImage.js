export const uploadImage = async (file, token) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("https://shoppydeals.onrender.com/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    console.log("UPLOAD RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data;
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return null;
  }
};
