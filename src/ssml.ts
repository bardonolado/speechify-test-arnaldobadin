/**
 * SSML (Speech Synthesis Markup Language) is a subset of XML specifically
 * designed for controlling synthesis. You can see examples of how the SSML
 * should be parsed in `ssml.test.ts`.
 *
 * DO NOT USE CHATGPT, COPILOT, OR ANY AI CODING ASSISTANTS.
 * Conventional auto-complete and Intellisense are allowed.
 *
 * DO NOT USE ANY PRE-EXISTING XML PARSERS FOR THIS TASK.
 * You may use online references to understand the SSML specification, but DO NOT read
 * online references for implementing an XML/SSML parser.
 */

import {DOMParser} from "xmldom";

/** Parses SSML to a SSMLNode, throwing on invalid SSML */
export function parseSSML(ssml: string): SSMLNode {
  // NOTE: Don't forget to run unescapeXMLChars on the SSMLText

  ssml = parseSSMLText(ssml);

  let shouldThrow;
  const parser = new DOMParser({
    errorHandler: { warning: (w) => {
      console.log(w);
      shouldThrow = true
    } }
  });
  const parsed = parser.parseFromString(ssml.trim());

  if (Object.values(parsed.childNodes)?.length > 2) {
    throw new Error( "Invalid ssml text");
  }

  const mapFunc = (node: HTMLElement) => {
    let newNode: SSMLTag = {
      name: node.nodeName,
      attributes: Object.values(node.attributes).filter(v => v.name).map(v => ({name: v.name, value: v.value})),
      children: []
    };

    const values = node.childNodes ? Object.values(node.childNodes) : [];
    
    for (const child of values) {
      if (child.nodeValue && child.nodeType === child.TEXT_NODE) {
        newNode.children.push(unescapeXMLChars(child.nodeValue));
        continue;
      }

      if (!child.nodeName) continue;
      newNode.children.push(mapFunc(child as HTMLElement));
    }

    return newNode;
  };

  const mapped = mapFunc(parsed.documentElement);
  if (shouldThrow || !mapped || mapped.name !== "speak") throw new Error("Invalid ssml text");

  // console.log("parsed", parsed);
  // console.log("mapped", mapped);

  return mapped;
}

function parseSSMLText(ssml: string): string {
  ssml = ssml.replace(/ +(?= )/g, "").trim();

  let isTag = false;
  let currentTag = "";
  
  let stack = [];

  for (const char of ssml) {
    if (isTag) currentTag += char;

    if(char === "<") {
      currentTag += char;
      isTag = true;
    } else if (char === ">") {
      isTag = false;
      const currentTagReplaced = currentTag.replace(/ +(?= )/g, "").trim().replace(/< /gmi, "<").replace(/ >/gmi, ">").replace(/<\/ /gmi, "</");
      ssml = ssml.replace(currentTag, currentTagReplaced);

      if (currentTagReplaced.match(/(\/\>)$/gmi)) {
        currentTag = "";
        continue;
      }

      const key = currentTagReplaced.replace(/^(\<\/)|^(\<)|(\>)$|^(\/)/gmi, "").split(" ")[0].trim();
      if (currentTag[1] === "/") {
        if (stack[stack.length - 1] === key) {
          stack.pop();
        } else {
          throw new Error("Invalid ssml text");
        }
      } else {
        stack.push(key);
      }

      currentTag = "";
    }
  }

  if (ssml[0] !== "<") throw new Error("Invalid ssml text");
  if (stack.length) throw new Error("Invalid ssml text");
  
  return ssml;
}

/** Recursively converts SSML node to string and unescapes XML chars */
export function ssmlNodeToText(node: SSMLNode): string {
  const mapFunc = (node: SSMLNode) => {
    if (typeof node === "string") {
      return node;
    }

    let res = "";

    for (const child of node.children) {
      res += mapFunc(child);
    }

    return res;
  };

  return mapFunc(node);
}

// Already done for you
const unescapeXMLChars = (text: string) =>
  text.replace(/&lt;/, '<').replace(/&gt;/, '>').replace(/&amp;/, '&')

type SSMLNode = SSMLTag | SSMLText
type SSMLTag = {
  name: string
  attributes: SSMLAttribute[]
  children: SSMLNode[]
}
type SSMLText = string
type SSMLAttribute = { name: string; value: string }
