import { db } from "@/db";
import { categories } from "@/db/schema";
import { Description } from "@radix-ui/react-toast";

// TODO:Create a script to seed categories
const categoryNames=[
  "Eduction",
  "Gaming",
  "Film and animation",
  "Music",
  "Science and Technology",
  "Pets and Animals",
  "Sports",
  "Travel and events",
  "News and politics",
  "Vlog",
]
async function main(){
  console.log("Seeding categories...");
  try{
    const values=categoryNames.map((name)=>({
      name,
      Description:`Videos related to ${name.toLowerCase()}`
    }))
    await db.insert(categories).values(values);
    console.log("Categories seeded successfully");
    
  }catch(error){
    console.error("Error seeding categories: ",error)
    /* process：Node.js 的一个全局对象，代表当前运行的进程。
        exit()：一个方法，用于手动终止当前进程。
        exit(1)：表示以错误状态退出。 */
    process.exit(1)
  }
}
main();