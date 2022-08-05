import { TrieNode } from "./TrieNode";

export class Trie {
  _root = new TrieNode(null);
  get root() {
    return this._root;
  }
  set root(newRoot) {
    this._root = newRoot;
  }

  insert(word: string): void {
    let current = this._root;
    for (const char of word) {
      if (!(char in current.children)) {
        current.children[char] = new TrieNode(char);
      }
      current = <TrieNode>current.children[char];
    }
    current.endOfWord = true;
  }

  contains(word: string): boolean {
    let current = this._root;
    for (const char of word) {
      if (!(char in current.children)) {
        return false;
      }
      current = <TrieNode>current.children[char];
    }
    if (current.value === null) {
      return false;
    }
    return current.endOfWord;
  }

  toString() {
    let res = "";
    traverse(this._root);
    function traverse(node: TrieNode) {
      Object.keys(node.children).forEach((childKey) => {
        const childVal = node.children[childKey];
        if (childVal.value !== null) {
          res += childVal.value;
          traverse(childVal);
        }
      });
    }

    return res;
  }
}
