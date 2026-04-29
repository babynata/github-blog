window.BLOG_KNOWLEDGE_POINTS = [
  {
    label: "代码 RAG",
    date: "2026.04.28",
    title: "Cursor 是目前这条路线里代码 RAG 做得最细的",
    paragraphs: [
      "它不是简单按行或 token 分块，而是借助 tree-sitter 做 AST 深度优先遍历，在语义边界，比如类定义和函数体处切割，并保留混淆后的相对文件路径作为元信息，兼顾隐私与检索精度。"
    ],
    tags: ["Cursor", "RAG", "AST", "tree-sitter"]
  }
];
