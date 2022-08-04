import {TrieNode} from "./TrieNode"

export class Trie {
  _root = new TrieNode(null)
  get root(){
    return this._root
  }
  set root(newRoot){
    this._root = newRoot
  }

  insert(word: string): void {
    let current = this._root
    for(const char of word){
      const charVal = TrieNode.charIntVal(char)
      if(current.children[charVal] === null){
        current.children[charVal] = new TrieNode(char)
      }
      current = <TrieNode>current.children[charVal]
    }
    current.endOfWord = true
  }

  contains(word: string): boolean {
    let current = this._root
    for(const char of word){
      const charVal = TrieNode.charIntVal(char)
      if(current.children[charVal] === null){
        return false
      }
      current = <TrieNode>current.children[charVal]
    }
    if(current.value === null){
      return false
    }
    return current.endOfWord
  }

  toString() {
    let res = ""
    traverse(this._root)
    function traverse(node: TrieNode){
      node.children.forEach(child => {
        if(child !== null && child.value !== null){
          res += child.value
          traverse(child)
        }
      })
    }

    return res
  }
}
