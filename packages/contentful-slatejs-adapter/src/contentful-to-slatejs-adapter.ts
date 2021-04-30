import flatmap from 'lodash.flatmap';

import { fromJSON } from './schema';
import { getDataOrDefault } from './helpers';

import type { Schema, SchemaJSON } from './schema';
import * as Contentful from '@contentful/rich-text-types';
import {
  ContentfulNode,
  ContentfulElementNode,
  SlateNode,
  SlateElement,
  SlateText,
} from './types';

export interface ToSlatejsDocumentProperties {
  document: Contentful.Document;
  schema?: SchemaJSON;
}

export default function toSlatejsDocument({
  document,
  schema,
}: ToSlatejsDocumentProperties): SlateNode[] {
  // TODO:
  // We allow adding data to the root document node, but Slate >v0.5.0
  // has no concept of a root document node. We should determine whether
  // this will be a compatibility problem for existing users.
  return flatmap(document.content, node => convertNode(node, fromJSON(schema)))
}

function convertNode(node: ContentfulNode, schema: Schema): SlateNode {
  if (node.nodeType === 'text') {
    return convertTextNode(node as Contentful.Text);
  } else {
    const contentfulNode = node as ContentfulElementNode;
    const childNodes = flatmap(contentfulNode.content, childNode => convertNode(childNode, schema));
    const slateNode = convertElementNode(contentfulNode, childNodes, schema);
    return slateNode;
  }
}

function convertElementNode(
  contentfulBlock: ContentfulElementNode,
  children: SlateNode[],
  schema: Schema,
): SlateElement {
  return {
    type: contentfulBlock.nodeType,
    children,
    isVoid: schema.isVoid(contentfulBlock),
    data: getDataOrDefault(contentfulBlock.data),
  };
}

function convertTextNode(node: Contentful.Text): SlateText {
  return {
    text: node.value,
    data: getDataOrDefault(node.data),
    ...convertTextMarks(node)
  };
}

type SlateMarks = { [mark: string]: true };
function convertTextMarks(node: Contentful.Text): SlateMarks {
  const marks: SlateMarks = {};
  for (const mark of node.marks) {
    marks[mark.type] = true;
  }
  return marks;
}
