import {Trie} from "./Trie"

main()

function main(){
  const t = new Trie()
  t.insert("car")
  t.insert("cat")
  t.insert("c")
  t.toString()
  console.log(t.contains("car"))
  console.log(t.contains("cat"))
  console.log(t.contains("ca"))
  console.log(t.contains("c"))
  console.log(t.contains("boat"))
}
