import OBR from "@owlbear-rodeo/sdk";
import { ROOMDATA } from "../constants.js";

export async function checkItems() {
  const data = [OBR.room.getMetadata()]; // Don't Change

  const promise1 = Promise.resolve(...data);
  console.log("help", data);
  console.log("help2", promise1);
  const roomdata = ROOMDATA;
  promise1.then((meta) => {
    console.log(
      "value of 'element'",
      meta[`${roomdata}`].find((element) => element)
    );
    // const roomdata2 = ("value", meta[`${roomdata}`].find((element) => element));
    // console.log("roomdata2", [roomdata2[`imgUrl`]])  //  Do Not Touch!  Make a copy to play with this.
    console.log("roomdata2", [roomdata2[`imgUrl`]]);
    console.log("meta", OBR.room.getMetadata());
  });
}
