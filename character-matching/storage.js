import OBR from "@owlbear-rodeo/sdk";
import { ID, ROOMDATA } from "../constants.js";
//import { stringify } from "querystring";
// import { stringify } from "querystring";
// import { parse } from "path";
// import { stringify } from "querystring";

export function storeItems(name, imageUrl, notebookUrl, dndbCharID) {
  //TODO: Before the stringify should be a trim
  //Remove https://images.owlbear.rodeo/ and concatonate after getMetadata
  const id = ID;
  const roomdata = ROOMDATA;
  var newName = "";
  var newImageUrl = "";
  var newDndbCharID = "";
  var newNotebookUrl = "";

  //TODO this will add the storage item if not found
  //creates the array of items to be stored as "value"
  const valueObj = [newNotebookUrl, newDndbCharID];
  const valueString = JSON.stringify(valueObj);
  newName = name;
  newImageUrl = imageUrl;
  newDndbCharID = dndbCharID;
  newNotebookUrl = notebookUrl;
  const keyString = imageUrl;
  localStorage.setItem(keyString, valueString);

  //set and get Metadata

  //TODO: Before setMetadata should be a remove https://images.owlbear.rodeo/ and concatonate back in after getMetadata
  OBR.room.setMetadata({
    [`${id}/storedItems/`]: [
      {
        name: newName,
        imgUrl: imageUrl,
        DnDBeyond: newDndbCharID,
        Notebook: newNotebookUrl,
      },
    ],
  });
  //OBR.room.setMetadata({ [`${id}/storedItems/${newName}`]:[{[newName]:[{newName, newImageUrl, newDndbCharID, newNotebookUrl}]}]})

  //   const data = OBR.room.getMetadata()//added brackets - brackets broke it.
  //   const newData = [`${id}/storedItems`]
  //   //console.log("data", [`${newName}`])
  //   //console.log("newData",[data]

  //   //console.log("newName", [{newData}])
  //   console.log("storeItems",newImageUrl)
}

export async function checkItems(imageUrl) {
  const image = "";
  const id = ID;
  // const dndbCharID = ""
  const data = [OBR.room.getMetadata()]; // Don't Change

  // const [newData] = [`${id}/storedItems/`]//concatonate
  const newData2 = JSON.stringify(...data);

  //keep this
  const promise1 = Promise.resolve(...data);
  // const promise1 = Promise.resolve(...data); // ARRAY! Do not change
  const roomdata = ROOMDATA;
  promise1.then((meta) => {
    console.log(
      "value of 'element'",
      meta[`${roomdata}`].find((element) => element)
    ); // Do not change.  A more complete array
    const roomdata2 = ("value", meta[`${roomdata}`].find((element) => element));
    // console.log("roomdata2", [roomdata2[`imgUrl`]])  //  Do Not Touch!  Make a copy to play with this.
    console.log("roomdata2", [roomdata2[`imgUrl`]]);
    const imageMeta = ("roomdata2", [roomdata2[`imgUrl`]]);

    console.log("newImageUrl", imageUrl);
    if (imageUrl == imageMeta) console.log("true", meta);
    else {
      console.log("false", meta);
    }

    // meta = []
    //     const promise2 = Promise.resolve(...meta);
    //     // const promise1 = Promise.resolve(...data); // ARRAY! Do not change

    //     promise2.then((meta2) => {

    //       console.log("value", meta2[`${roomdata}`].find(imageUrl)); // Do not change.  A more complete array
    //     });
  });

  // console.log("2/21-1", [`${[...data]}`])
  //console.log("2/21-2", [...data])
  // console.log("2/21-3", ...data)

  //console.log("newData", ({[`${newData}`]: [{...data}]})) //Save for later
  //console.log("newData", ({[`${newData}`]: [{...`${data}`}]})) //Save for later
  // console.log("data", data)//promise
  //console.log("newData", {[`${newData}`]: {...`${data}`}}) // Provides the name in the array
  // console.log("newData2", (newData2) ) // Use to look for the right string data

  //     //DO SOMETHING
  //     //this should be called after click "addToUrls" but before popup
  //     //afterwards - move set and get Metadata to here
  //     OBR.room.getMetadata
}

//  export function match(){
//     if ((newImageUrl) === (imageMeta))
//         return true
//     console.log(match)

//  }
