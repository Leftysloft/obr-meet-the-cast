// characterData.js

// Function to fetch character data based on character ID
export async function fetchCharacterData(charId) {
  // console.log("Calling fetchCharacterData for", charId);

  //change this line only for python server!
  // const url = `http://127.0.0.1:5000/api/character/${charId}`;
  const url = `https://lefty469.pythonanywhere.com/api/character/${charId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch character data");
    }

    const data = await response.json();
    console.log("Fetched character data:", data); // Log the fetched data for debugging

    // You can modify this return statement as needed
    return data;
  } catch (error) {
    console.error("Error fetching character data:", error);
    return null;
  }
}
