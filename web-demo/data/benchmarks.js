window.TACGEN_DATA = {
  "b1": {
    "id": "b1",
    "name": "b1: While-Loop Relational Jump",
    "file": "bench/b1.mini",
    "description": "Standard while-loop example from Stage-2 Report (Table 6). Demonstrates inverted relational jumps, loop headers, retreating back-edges, and dominance-frontier phi placement for accumulators.",
    "source": "int s; int i;\ns = 0;\ni = 1;\nwhile (i <= n) {\n    s = s + i * 2;\n    i = i + 1;\n}\nreturn s;\n",
    "tokens": {
      "raw": "LINE  CLASS          LEXEME\n1     KEYWORD        int\n1     ID             s\n1     DELIM          ;\n1     KEYWORD        int\n1     ID             i\n1     DELIM          ;\n2     ID             s\n2     ARITH/ASSIGN   =\n2     NUM            0\n2     DELIM          ;\n3     ID             i\n3     ARITH/ASSIGN   =\n3     NUM            1\n3     DELIM          ;\n4     KEYWORD        while\n4     DELIM          (\n4     ID             i\n4     RELOP          <=\n4     ID             n\n4     DELIM          )\n4     DELIM          {\n5     ID             s\n5     ARITH/ASSIGN   =\n5     ID             s\n5     ARITH/ASSIGN   +\n5     ID             i\n5     ARITH/ASSIGN   *\n5     NUM            2\n5     DELIM          ;\n6     ID             i\n6     ARITH/ASSIGN   =\n6     ID             i\n6     ARITH/ASSIGN   +\n6     NUM            1\n6     DELIM          ;\n7     DELIM          }\n8     KEYWORD        return\n8     ID             s\n8     DELIM          ;\n",
      "parsed": []
    },
    "ast": {
      "raw": "Program (line 1)\n  Decl s (line 1)\n  Decl i (line 1)\n  Assign s (line 2)\n    Num 0\n  Assign i (line 3)\n    Num 1\n  While (line 4)\n    RelOp <=\n      Var i\n      Var n\n    Block (line 4)\n      Assign s (line 5)\n        BinOp +\n          Var s\n          BinOp *\n            Var i\n            Num 2\n      Assign i (line 6)\n        BinOp +\n          Var i\n          Num 1\n  Return (line 8)\n    Var s\n"
    },
    "tac": {
      "raw": "1: s = 0\n2: i = 1\n3: L1: if i > n goto L2\n4: t1 = i * 2\n5: t2 = s + t1\n6: s = t2\n7: t3 = i + 1\n8: i = t3\n9: goto L1\n10: L2: return s\ninstructions=10 temporaries=3 labels=2\n",
      "parsed": {
        "instructions": [
          {
            "num": 1,
            "label": "",
            "code": "s = 0",
            "raw": "1: s = 0"
          },
          {
            "num": 2,
            "label": "",
            "code": "i = 1",
            "raw": "2: i = 1"
          },
          {
            "num": 3,
            "label": "L1",
            "code": "if i > n goto L2",
            "raw": "3: L1: if i > n goto L2"
          },
          {
            "num": 4,
            "label": "",
            "code": "t1 = i * 2",
            "raw": "4: t1 = i * 2"
          },
          {
            "num": 5,
            "label": "",
            "code": "t2 = s + t1",
            "raw": "5: t2 = s + t1"
          },
          {
            "num": 6,
            "label": "",
            "code": "s = t2",
            "raw": "6: s = t2"
          },
          {
            "num": 7,
            "label": "",
            "code": "t3 = i + 1",
            "raw": "7: t3 = i + 1"
          },
          {
            "num": 8,
            "label": "",
            "code": "i = t3",
            "raw": "8: i = t3"
          },
          {
            "num": 9,
            "label": "",
            "code": "goto L1",
            "raw": "9: goto L1"
          },
          {
            "num": 10,
            "label": "L2",
            "code": "return s",
            "raw": "10: L2: return s"
          }
        ],
        "summary": "instructions=10 temporaries=3 labels=2"
      }
    },
    "formats": {
      "raw": "QUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    =       0               s       \n(1)    =       1               i       \n(2)    if>     i       n       L2      L1\n(3)    *       i       2       t1      \n(4)    +       s       t1      t2      \n(5)    =       t2              s       \n(6)    +       i       1       t3      \n(7)    =       t3              i       \n(8)    goto                    L1      \n(9)    return  s                       L2\n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    =       s       0       \n(1)    =       i       1       \n(2)    >       i       n       L1\n(3)    if      (2)     L2      \n(4)    *       i       2       \n(5)    +       s       (4)     \n(6)    =       s       (5)     \n(7)    +       i       1       \n(8)    =       i       (7)     \n(9)    goto            L1      \n(10)   return  s               L2\n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n41       (6)\n42       (7)\n43       (8)\n44       (9)\n45       (10)\n\nformat           | entries | bytes\nquadruples       | 10      | 130\ntriples          | 11      | 99\nindirect triples | 11      | 143\n",
      "parsed": {
        "quadruples": [
          {
            "index": "(0)",
            "op": "=",
            "arg1": "0",
            "arg2": "s",
            "result": "",
            "label": "",
            "raw": "(0)    =       0               s"
          },
          {
            "index": "(1)",
            "op": "=",
            "arg1": "1",
            "arg2": "i",
            "result": "",
            "label": "",
            "raw": "(1)    =       1               i"
          },
          {
            "index": "(2)",
            "op": "if>",
            "arg1": "i",
            "arg2": "n",
            "result": "L2",
            "label": "L1",
            "raw": "(2)    if>     i       n       L2      L1"
          },
          {
            "index": "(3)",
            "op": "*",
            "arg1": "i",
            "arg2": "2",
            "result": "t1",
            "label": "",
            "raw": "(3)    *       i       2       t1"
          },
          {
            "index": "(4)",
            "op": "+",
            "arg1": "s",
            "arg2": "t1",
            "result": "t2",
            "label": "",
            "raw": "(4)    +       s       t1      t2"
          },
          {
            "index": "(5)",
            "op": "=",
            "arg1": "t2",
            "arg2": "s",
            "result": "",
            "label": "",
            "raw": "(5)    =       t2              s"
          },
          {
            "index": "(6)",
            "op": "+",
            "arg1": "i",
            "arg2": "1",
            "result": "t3",
            "label": "",
            "raw": "(6)    +       i       1       t3"
          },
          {
            "index": "(7)",
            "op": "=",
            "arg1": "t3",
            "arg2": "i",
            "result": "",
            "label": "",
            "raw": "(7)    =       t3              i"
          },
          {
            "index": "(8)",
            "op": "goto",
            "arg1": "L1",
            "arg2": "",
            "result": "",
            "label": "",
            "raw": "(8)    goto                    L1"
          },
          {
            "index": "(9)",
            "op": "return",
            "arg1": "s",
            "arg2": "L2",
            "result": "",
            "label": "",
            "raw": "(9)    return  s                       L2"
          }
        ],
        "triples": [
          {
            "index": "(0)",
            "op": "=",
            "arg1": "s",
            "arg2": "0",
            "label": "",
            "raw": "(0)    =       s       0"
          },
          {
            "index": "(1)",
            "op": "=",
            "arg1": "i",
            "arg2": "1",
            "label": "",
            "raw": "(1)    =       i       1"
          },
          {
            "index": "(2)",
            "op": ">",
            "arg1": "i",
            "arg2": "n",
            "label": "L1",
            "raw": "(2)    >       i       n       L1"
          },
          {
            "index": "(3)",
            "op": "if",
            "arg1": "(2)",
            "arg2": "L2",
            "label": "",
            "raw": "(3)    if      (2)     L2"
          },
          {
            "index": "(4)",
            "op": "*",
            "arg1": "i",
            "arg2": "2",
            "label": "",
            "raw": "(4)    *       i       2"
          },
          {
            "index": "(5)",
            "op": "+",
            "arg1": "s",
            "arg2": "(4)",
            "label": "",
            "raw": "(5)    +       s       (4)"
          },
          {
            "index": "(6)",
            "op": "=",
            "arg1": "s",
            "arg2": "(5)",
            "label": "",
            "raw": "(6)    =       s       (5)"
          },
          {
            "index": "(7)",
            "op": "+",
            "arg1": "i",
            "arg2": "1",
            "label": "",
            "raw": "(7)    +       i       1"
          },
          {
            "index": "(8)",
            "op": "=",
            "arg1": "i",
            "arg2": "(7)",
            "label": "",
            "raw": "(8)    =       i       (7)"
          },
          {
            "index": "(9)",
            "op": "goto",
            "arg1": "L1",
            "arg2": "",
            "label": "",
            "raw": "(9)    goto            L1"
          },
          {
            "index": "(10)",
            "op": "return",
            "arg1": "s",
            "arg2": "L2",
            "label": "",
            "raw": "(10)   return  s               L2"
          }
        ],
        "indirect_triples": [
          {
            "pointer": "35",
            "target": "(0)"
          },
          {
            "pointer": "36",
            "target": "(1)"
          },
          {
            "pointer": "37",
            "target": "(2)"
          },
          {
            "pointer": "38",
            "target": "(3)"
          },
          {
            "pointer": "39",
            "target": "(4)"
          },
          {
            "pointer": "40",
            "target": "(5)"
          },
          {
            "pointer": "41",
            "target": "(6)"
          },
          {
            "pointer": "42",
            "target": "(7)"
          },
          {
            "pointer": "43",
            "target": "(8)"
          },
          {
            "pointer": "44",
            "target": "(9)"
          },
          {
            "pointer": "45",
            "target": "(10)"
          }
        ],
        "summary": [
          {
            "format": "quadruples",
            "entries": 10,
            "bytes": 130
          },
          {
            "format": "triples",
            "entries": 11,
            "bytes": 99
          },
          {
            "format": "indirect triples",
            "entries": 11,
            "bytes": 143
          }
        ]
      },
      "edit_demo": null
    },
    "blocks": {
      "raw": "B1 [1-2] labels=- pred=- succ=B2\n    s = 0\n    i = 1\nB2 [3-3] labels=L1 pred=B1,B3 succ=B3(i <= n),B4(i > n)\n    if i > n goto L2\nB3 [4-9] labels=- pred=B2 succ=B2\n    t1 = i * 2\n    t2 = s + t1\n    s = t2\n    t3 = i + 1\n    i = t3\n    goto L1\nB4 [10-10] labels=L2 pred=B2 succ=-\n    return s\nback edges: B3->B2\nblocks=4 edges=4 back_edges=1\n",
      "parsed": {
        "blocks": [
          {
            "id": "B1",
            "range": "[1-2]",
            "labels": "",
            "pred": [],
            "succ": [
              "B2"
            ],
            "instrs": [
              "s = 0",
              "i = 1"
            ]
          },
          {
            "id": "B2",
            "range": "[3-3]",
            "labels": "L1",
            "pred": [
              "B1",
              "B3"
            ],
            "succ": [
              "B3(i <= n)",
              "B4(i > n)"
            ],
            "instrs": [
              "if i > n goto L2"
            ]
          },
          {
            "id": "B3",
            "range": "[4-9]",
            "labels": "",
            "pred": [
              "B2"
            ],
            "succ": [
              "B2"
            ],
            "instrs": [
              "t1 = i * 2",
              "t2 = s + t1",
              "s = t2",
              "t3 = i + 1",
              "i = t3",
              "goto L1"
            ]
          },
          {
            "id": "B4",
            "range": "[10-10]",
            "labels": "L2",
            "pred": [
              "B2"
            ],
            "succ": [],
            "instrs": [
              "return s"
            ]
          }
        ],
        "summary": {
          "blocks": 4,
          "edges": 4,
          "back_edges": 1
        },
        "back_edges": [
          "B3->B2"
        ]
      }
    },
    "cfg": {
      "dot": "digraph CFG {\n  node [shape=box, fontname=\"Courier\"];\n  edge [fontname=\"Courier\"];\n\n  B1 [label=\"B1\\ls = 0\\li = 1\\l\"];\n  B2 [label=\"B2 (L1)\\lif i > n goto L2\\l\"];\n  B3 [label=\"B3\\lt1 = i * 2\\lt2 = s + t1\\ls = t2\\lt3 = i + 1\\li = t3\\lgoto L1\\l\"];\n  B4 [label=\"B4 (L2)\\lreturn s\\l\"];\n\n  B1 -> B2;\n  B2 -> B3 [label=\"i <= n\"];\n  B2 -> B4 [label=\"i > n\"];\n  B3 -> B2 [color=red];\n}\n",
      "svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\"\n \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<!-- Generated by graphviz version 14.1.2 (0)\n -->\n<!-- Title: CFG Pages: 1 -->\n<svg width=\"214pt\" height=\"329pt\"\n viewBox=\"0.00 0.00 214.00 329.00\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n<g id=\"graph0\" class=\"graph\" transform=\"scale(1 1) rotate(0) translate(4 325.25)\">\n<title>CFG</title>\n<polygon fill=\"white\" stroke=\"none\" points=\"-4,4 -4,-325.25 210.38,-325.25 210.38,4 -4,4\"/>\n<!-- B1 -->\n<g id=\"node1\" class=\"node\">\n<title>B1</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"147,-321.25 89.75,-321.25 89.75,-261.5 147,-261.5 147,-321.25\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"97.75\" y=\"-303.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">B1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"97.75\" y=\"-286.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">s = 0</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"97.75\" y=\"-269.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">i = 1</text>\n</g>\n<!-- B2 -->\n<g id=\"node2\" class=\"node\">\n<title>B2</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"192.38,-224.5 44.38,-224.5 44.38,-182 192.38,-182 192.38,-224.5\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"52.38\" y=\"-207.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">B2 (L1)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"52.38\" y=\"-189.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">if i &gt; n goto L2</text>\n</g>\n<!-- B1&#45;&gt;B2 -->\n<g id=\"edge1\" class=\"edge\">\n<title>B1&#45;&gt;B2</title>\n<path fill=\"none\" stroke=\"black\" d=\"M118.38,-261.22C118.38,-253.22 118.38,-244.5 118.38,-236.34\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"121.88,-236.46 118.38,-226.46 114.88,-236.46 121.88,-236.46\"/>\n</g>\n<!-- B3 -->\n<g id=\"node3\" class=\"node\">\n<title>B3</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"106.75,-128.75 0,-128.75 0,0 106.75,0 106.75,-128.75\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-111.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">B3</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-94.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t1 = i * 2</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-76.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">t2 = s + t1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-59.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">s = t2</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-42.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t3 = i + 1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-25.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">i = t3</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-7.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">goto L1</text>\n</g>\n<!-- B2&#45;&gt;B3 -->\n<g id=\"edge2\" class=\"edge\">\n<title>B2&#45;&gt;B3</title>\n<path fill=\"none\" stroke=\"black\" d=\"M71.1,-181.56C64.63,-176.73 58.85,-170.92 54.88,-164 50.74,-156.81 48.11,-148.8 46.58,-140.55\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"50.06,-140.17 45.31,-130.7 43.11,-141.06 50.06,-140.17\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"79.62\" y=\"-150.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">i &lt;= n</text>\n</g>\n<!-- B4 -->\n<g id=\"node4\" class=\"node\">\n<title>B4</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"206.38,-85.62 124.38,-85.62 124.38,-43.12 206.38,-43.12 206.38,-85.62\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"132.38\" y=\"-68.33\" font-family=\"Courier,monospace\" font-size=\"14.00\">B4 (L2)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"132.38\" y=\"-51.08\" font-family=\"Courier,monospace\" font-size=\"14.00\">return s</text>\n</g>\n<!-- B2&#45;&gt;B4 -->\n<g id=\"edge3\" class=\"edge\">\n<title>B2&#45;&gt;B4</title>\n<path fill=\"none\" stroke=\"black\" d=\"M126.04,-181.64C128.13,-175.94 130.36,-169.74 132.38,-164 140.26,-141.49 148.79,-115.96 155.2,-96.51\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"158.44,-97.86 158.24,-87.27 151.79,-95.68 158.44,-97.86\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"158.57\" y=\"-150.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">i &gt; n</text>\n</g>\n<!-- B3&#45;&gt;B2 -->\n<g id=\"edge4\" class=\"edge\">\n<title>B3&#45;&gt;B2</title>\n<path fill=\"none\" stroke=\"red\" d=\"M95.93,-129.23C99.01,-135.03 101.89,-140.92 104.38,-146.75 107.57,-154.24 110.16,-162.63 112.2,-170.56\"/>\n<polygon fill=\"red\" stroke=\"red\" points=\"108.77,-171.3 114.45,-180.24 115.59,-169.71 108.77,-171.3\"/>\n</g>\n</g>\n</svg>\n",
      "svg_url": "assets/cfg/b1.svg",
      "png_url": "assets/cfg/b1.png"
    },
    "opt": {
      "raw": "No. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 10\n1   | Constant folding and propagation | 0       | 10\n2   | Strength reduction               | 1       | 10\n3   | CSE by local value numbering     | 0       | 10\n4   | Copy propagation                 | 0       | 10\n5   | Dead-code elimination            | 0       | 10\n6   | Temporary coalescing             | 4       | 8\n\noptimized code:\nB1:\n    s = 0\n    i = 1\nB2: (labels L1)\n    if i > n goto L2\nB3:\n    t1 = i << 1\n    s = s + t1\n    i = i + 1\n    goto L1\nB4: (labels L2)\n    return s\ninstructions: 10 -> 8   temporaries remaining: 1   liveness iterations: 3\n",
      "parsed": {
        "pass_table": [
          {
            "pass_num": 0,
            "name": "Unoptimized",
            "changes": 0,
            "instrs_after": 10
          },
          {
            "pass_num": 1,
            "name": "Constant folding and propagation",
            "changes": 0,
            "instrs_after": 10
          },
          {
            "pass_num": 2,
            "name": "Strength reduction",
            "changes": 1,
            "instrs_after": 10
          },
          {
            "pass_num": 3,
            "name": "CSE by local value numbering",
            "changes": 0,
            "instrs_after": 10
          },
          {
            "pass_num": 4,
            "name": "Copy propagation",
            "changes": 0,
            "instrs_after": 10
          },
          {
            "pass_num": 5,
            "name": "Dead-code elimination",
            "changes": 0,
            "instrs_after": 10
          },
          {
            "pass_num": 6,
            "name": "Temporary coalescing",
            "changes": 4,
            "instrs_after": 8
          }
        ],
        "optimized_code": "B1:\n    s = 0\n    i = 1\nB2: (labels L1)\n    if i > n goto L2\nB3:\n    t1 = i << 1\n    s = s + t1\n    i = i + 1\n    goto L1\nB4: (labels L2)\n    return s",
        "summary": "instructions: 10 -> 8   temporaries remaining: 1   liveness iterations: 3"
      }
    },
    "ssa": {
      "raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\nB2    | B1   | {B2}   | s,i\nB3    | B2   | {B2}   | -\nB4    | B2   | {}     | -\n\nB1:\n    s1 = 0\n    i1 = 1\nB2: (labels L1)\n    s2 = phi(s1, s3)\n    i2 = phi(i1, i3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 * 2\n    t2 = s2 + t1\n    s3 = t2\n    t3 = i2 + 1\n    i3 = t3\n    goto L1\nB4: (labels L2)\n    return s2\nphis_unpruned=2 phis_pruned=2\nverify: OK\n",
      "parsed": {
        "dom_table": [
          {
            "block": "B1",
            "idom": "-",
            "df": "{}",
            "phis": ""
          },
          {
            "block": "B2",
            "idom": "B1",
            "df": "{B2}",
            "phis": "s,i"
          },
          {
            "block": "B3",
            "idom": "B2",
            "df": "{B2}",
            "phis": ""
          },
          {
            "block": "B4",
            "idom": "B2",
            "df": "{}",
            "phis": ""
          }
        ],
        "ssa_code": "B1:\n    s1 = 0\n    i1 = 1\nB2: (labels L1)\n    s2 = phi(s1, s3)\n    i2 = phi(i1, i3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 * 2\n    t2 = s2 + t1\n    s3 = t2\n    t3 = i2 + 1\n    i3 = t3\n    goto L1\nB4: (labels L2)\n    return s2",
        "summary": "phis_unpruned=2 phis_pruned=2",
        "verify": "verify: OK"
      },
      "unpruned_raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\nB2    | B1   | {B2}   | s,i\nB3    | B2   | {B2}   | -\nB4    | B2   | {}     | -\n\nB1:\n    s1 = 0\n    i1 = 1\nB2: (labels L1)\n    s2 = phi(s1, s3)\n    i2 = phi(i1, i3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 * 2\n    t2 = s2 + t1\n    s3 = t2\n    t3 = i2 + 1\n    i3 = t3\n    goto L1\nB4: (labels L2)\n    return s2\nphis_unpruned=2 phis_pruned=2\nverify: OK\n"
    },
    "ssa_opt": {
      "raw": "B1: (empty)\nB2: (labels L1)\n    s2 = phi(0, t2)\n    i2 = phi(1, t3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 << 1\n    t2 = s2 + t1\n    t3 = i2 + 1\n    goto L1\nB4: (labels L2)\n    return s2\nssa instrs: 12 -> 8   rounds: 1   copies propagated: 2   phis removed: 0   dataflow iterations: 0\nverify: OK\n",
      "parsed": {
        "code": "B1: (empty)\nB2: (labels L1)\n    s2 = phi(0, t2)\n    i2 = phi(1, t3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 << 1\n    t2 = s2 + t1\n    t3 = i2 + 1\n    goto L1\nB4: (labels L2)\n    return s2",
        "summary": "ssa instrs: 12 -> 8   rounds: 1   copies propagated: 2   phis removed: 0   dataflow iterations: 0",
        "verify": "verify: OK"
      }
    },
    "braun": {
      "raw": "B1:\n    s1 = 0\n    i1 = 1\nB2: (labels L1)\n    i2 = phi(i1, i3)\n    s2 = phi(s1, s3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 * 2\n    t2 = s2 + t1\n    s3 = t2\n    t3 = i2 + 1\n    i3 = t3\n    goto L1\nB4: (labels L2)\n    return s2\nphis_braun=2\nverify: OK\n"
    },
    "compare": {
      "raw": "phis_cytron_pruned=2 phis_braun=2 MATCH\nverify: OK\n"
    },
    "metrics": {
      "raw": "metric                        | value\n------------------------------+--------------------------------------\ntac_instrs                    | 10\ntemps_created                 | 3\nlabels                        | 2\nblocks                        | 4\nedges                         | 4\nback_edges                    | 1\nquad_entries                  | 10\nquad_bytes                    | 130\ntriple_entries                | 11\ntriple_bytes                  | 99\nindirect_entries              | 11\nindirect_bytes                | 143\ndel_shift_total_quad          | 0\ndel_shift_total_triple        | 55\ndel_shift_total_indirect      | 0\ndel_rewrite_total_quad        | 0\ndel_rewrite_total_triple      | 18\ndel_rewrite_total_indirect    | 0\nopt_instrs_after              | 8\nopt_temps_remaining           | 1\nliveness_iterations           | 3\nphis_unpruned                 | 2\nphis_pruned                   | 2\nphis_braun                    | 2\nssa_instrs_before_opt         | 12\nssa_instrs_after_opt          | 8\nssa_opt_rounds                | 1\ntime_frontend_us_min          | 47.77 (indicative only)\ntime_frontend_us_mean         | 56.15 (indicative only)\ntime_cfg_us_min               | 28.45 (indicative only)\ntime_cfg_us_mean              | 31.14 (indicative only)\ntime_opt_us_min               | 93.29 (indicative only)\ntime_opt_us_mean              | 105.82 (indicative only)\ntime_ssa_us_min               | 99.67 (indicative only)\ntime_ssa_us_mean              | 115.47 (indicative only)\ntime_ssaopt_us_min            | 46.33 (indicative only)\ntime_ssaopt_us_mean           | 49.74 (indicative only)\n",
      "parsed": {
        "tac_instrs": "10",
        "temps_created": "3",
        "labels": "2",
        "blocks": "4",
        "edges": "4",
        "back_edges": "1",
        "quad_entries": "10",
        "quad_bytes": "130",
        "triple_entries": "11",
        "triple_bytes": "99",
        "indirect_entries": "11",
        "indirect_bytes": "143",
        "del_shift_total_quad": "0",
        "del_shift_total_triple": "55",
        "del_shift_total_indirect": "0",
        "del_rewrite_total_quad": "0",
        "del_rewrite_total_triple": "18",
        "del_rewrite_total_indirect": "0",
        "opt_instrs_after": "8",
        "opt_temps_remaining": "1",
        "liveness_iterations": "3",
        "phis_unpruned": "2",
        "phis_pruned": "2",
        "phis_braun": "2",
        "ssa_instrs_before_opt": "12",
        "ssa_instrs_after_opt": "8",
        "ssa_opt_rounds": "1",
        "time_frontend_us_min": "47.77",
        "time_frontend_us_mean": "56.15",
        "time_cfg_us_min": "28.45",
        "time_cfg_us_mean": "31.14",
        "time_opt_us_min": "93.29",
        "time_opt_us_mean": "105.82",
        "time_ssa_us_min": "99.67",
        "time_ssa_us_mean": "115.47",
        "time_ssaopt_us_min": "46.33",
        "time_ssaopt_us_mean": "49.74"
      }
    },
    "all": {
      "raw": "=== TAC ===\n1: s = 0\n2: i = 1\n3: L1: if i > n goto L2\n4: t1 = i * 2\n5: t2 = s + t1\n6: s = t2\n7: t3 = i + 1\n8: i = t3\n9: goto L1\n10: L2: return s\ninstructions=10 temporaries=3 labels=2\n\n=== FORMATS ===\nQUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    =       0               s       \n(1)    =       1               i       \n(2)    if>     i       n       L2      L1\n(3)    *       i       2       t1      \n(4)    +       s       t1      t2      \n(5)    =       t2              s       \n(6)    +       i       1       t3      \n(7)    =       t3              i       \n(8)    goto                    L1      \n(9)    return  s                       L2\n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    =       s       0       \n(1)    =       i       1       \n(2)    >       i       n       L1\n(3)    if      (2)     L2      \n(4)    *       i       2       \n(5)    +       s       (4)     \n(6)    =       s       (5)     \n(7)    +       i       1       \n(8)    =       i       (7)     \n(9)    goto            L1      \n(10)   return  s               L2\n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n41       (6)\n42       (7)\n43       (8)\n44       (9)\n45       (10)\n\nformat           | entries | bytes\nquadruples       | 10      | 130\ntriples          | 11      | 99\nindirect triples | 11      | 143\n\n=== BLOCKS & CFG ===\nB1 [1-2] labels=- pred=- succ=B2\n    s = 0\n    i = 1\nB2 [3-3] labels=L1 pred=B1,B3 succ=B3(i <= n),B4(i > n)\n    if i > n goto L2\nB3 [4-9] labels=- pred=B2 succ=B2\n    t1 = i * 2\n    t2 = s + t1\n    s = t2\n    t3 = i + 1\n    i = t3\n    goto L1\nB4 [10-10] labels=L2 pred=B2 succ=-\n    return s\nback edges: B3->B2\nblocks=4 edges=4 back_edges=1\n\n=== OPTIMIZATION ===\nNo. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 10\n1   | Constant folding and propagation | 0       | 10\n2   | Strength reduction               | 1       | 10\n3   | CSE by local value numbering     | 0       | 10\n4   | Copy propagation                 | 0       | 10\n5   | Dead-code elimination            | 0       | 10\n6   | Temporary coalescing             | 4       | 8\n\noptimized code:\nB1:\n    s = 0\n    i = 1\nB2: (labels L1)\n    if i > n goto L2\nB3:\n    t1 = i << 1\n    s = s + t1\n    i = i + 1\n    goto L1\nB4: (labels L2)\n    return s\ninstructions: 10 -> 8   temporaries remaining: 1   liveness iterations: 3\n\n=== SSA ===\nBlock | idom | DF     | phi placed for\nB1    | -    | {}     | -\nB2    | B1   | {B2}   | s,i\nB3    | B2   | {B2}   | -\nB4    | B2   | {}     | -\n\nB1:\n    s1 = 0\n    i1 = 1\nB2: (labels L1)\n    s2 = phi(s1, s3)\n    i2 = phi(i1, i3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 * 2\n    t2 = s2 + t1\n    s3 = t2\n    t3 = i2 + 1\n    i3 = t3\n    goto L1\nB4: (labels L2)\n    return s2\nphis_unpruned=2 phis_pruned=2\nverify: OK\n\n=== SSA OPTIMIZER ===\nB1: (empty)\nB2: (labels L1)\n    s2 = phi(0, t2)\n    i2 = phi(1, t3)\n    if i2 > n goto L2\nB3:\n    t1 = i2 << 1\n    t2 = s2 + t1\n    t3 = i2 + 1\n    goto L1\nB4: (labels L2)\n    return s2\nssa instrs: 12 -> 8   rounds: 1   copies propagated: 2   phis removed: 0   dataflow iterations: 0\nverify: OK\n"
    }
  },
  "b2": {
    "id": "b2",
    "name": "b2: Basic Block Arithmetic & Redundancies",
    "file": "bench/b2.mini",
    "description": "Single-block sequence from Stage-2 Report (Table 9). Features constant folding, strength reduction (* 8 -> << 3), common subexpression elimination (b + c), copy propagation, and dead code elimination with specified live-out variables.",
    "source": "int x; int y; int z; int w; int u; int k;\nx = 4*5;\ny = x+3;\nz = a*8;\nw = b+c;\nu = b+c;\nk = y*2;\n",
    "tokens": {
      "raw": "LINE  CLASS          LEXEME\n1     KEYWORD        int\n1     ID             x\n1     DELIM          ;\n1     KEYWORD        int\n1     ID             y\n1     DELIM          ;\n1     KEYWORD        int\n1     ID             z\n1     DELIM          ;\n1     KEYWORD        int\n1     ID             w\n1     DELIM          ;\n1     KEYWORD        int\n1     ID             u\n1     DELIM          ;\n1     KEYWORD        int\n1     ID             k\n1     DELIM          ;\n2     ID             x\n2     ARITH/ASSIGN   =\n2     NUM            4\n2     ARITH/ASSIGN   *\n2     NUM            5\n2     DELIM          ;\n3     ID             y\n3     ARITH/ASSIGN   =\n3     ID             x\n3     ARITH/ASSIGN   +\n3     NUM            3\n3     DELIM          ;\n4     ID             z\n4     ARITH/ASSIGN   =\n4     ID             a\n4     ARITH/ASSIGN   *\n4     NUM            8\n4     DELIM          ;\n5     ID             w\n5     ARITH/ASSIGN   =\n5     ID             b\n5     ARITH/ASSIGN   +\n5     ID             c\n5     DELIM          ;\n6     ID             u\n6     ARITH/ASSIGN   =\n6     ID             b\n6     ARITH/ASSIGN   +\n6     ID             c\n6     DELIM          ;\n7     ID             k\n7     ARITH/ASSIGN   =\n7     ID             y\n7     ARITH/ASSIGN   *\n7     NUM            2\n7     DELIM          ;\n",
      "parsed": []
    },
    "ast": {
      "raw": "Program (line 1)\n  Decl x (line 1)\n  Decl y (line 1)\n  Decl z (line 1)\n  Decl w (line 1)\n  Decl u (line 1)\n  Decl k (line 1)\n  Assign x (line 2)\n    BinOp *\n      Num 4\n      Num 5\n  Assign y (line 3)\n    BinOp +\n      Var x\n      Num 3\n  Assign z (line 4)\n    BinOp *\n      Var a\n      Num 8\n  Assign w (line 5)\n    BinOp +\n      Var b\n      Var c\n  Assign u (line 6)\n    BinOp +\n      Var b\n      Var c\n  Assign k (line 7)\n    BinOp *\n      Var y\n      Num 2\n"
    },
    "tac": {
      "raw": "1: t1 = 4 * 5\n2: x = t1\n3: t2 = x + 3\n4: y = t2\n5: t3 = a * 8\n6: z = t3\n7: t4 = b + c\n8: w = t4\n9: t5 = b + c\n10: u = t5\n11: t6 = y * 2\n12: k = t6\ninstructions=12 temporaries=6 labels=0\n",
      "parsed": {
        "instructions": [
          {
            "num": 1,
            "label": "",
            "code": "t1 = 4 * 5",
            "raw": "1: t1 = 4 * 5"
          },
          {
            "num": 2,
            "label": "",
            "code": "x = t1",
            "raw": "2: x = t1"
          },
          {
            "num": 3,
            "label": "",
            "code": "t2 = x + 3",
            "raw": "3: t2 = x + 3"
          },
          {
            "num": 4,
            "label": "",
            "code": "y = t2",
            "raw": "4: y = t2"
          },
          {
            "num": 5,
            "label": "",
            "code": "t3 = a * 8",
            "raw": "5: t3 = a * 8"
          },
          {
            "num": 6,
            "label": "",
            "code": "z = t3",
            "raw": "6: z = t3"
          },
          {
            "num": 7,
            "label": "",
            "code": "t4 = b + c",
            "raw": "7: t4 = b + c"
          },
          {
            "num": 8,
            "label": "",
            "code": "w = t4",
            "raw": "8: w = t4"
          },
          {
            "num": 9,
            "label": "",
            "code": "t5 = b + c",
            "raw": "9: t5 = b + c"
          },
          {
            "num": 10,
            "label": "",
            "code": "u = t5",
            "raw": "10: u = t5"
          },
          {
            "num": 11,
            "label": "",
            "code": "t6 = y * 2",
            "raw": "11: t6 = y * 2"
          },
          {
            "num": 12,
            "label": "",
            "code": "k = t6",
            "raw": "12: k = t6"
          }
        ],
        "summary": "instructions=12 temporaries=6 labels=0"
      }
    },
    "formats": {
      "raw": "QUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    *       4       5       t1      \n(1)    =       t1              x       \n(2)    +       x       3       t2      \n(3)    =       t2              y       \n(4)    *       a       8       t3      \n(5)    =       t3              z       \n(6)    +       b       c       t4      \n(7)    =       t4              w       \n(8)    +       b       c       t5      \n(9)    =       t5              u       \n(10)   *       y       2       t6      \n(11)   =       t6              k       \n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    *       4       5       \n(1)    =       x       (0)     \n(2)    +       x       3       \n(3)    =       y       (2)     \n(4)    *       a       8       \n(5)    =       z       (4)     \n(6)    +       b       c       \n(7)    =       w       (6)     \n(8)    +       b       c       \n(9)    =       u       (8)     \n(10)   *       y       2       \n(11)   =       k       (10)    \n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n41       (6)\n42       (7)\n43       (8)\n44       (9)\n45       (10)\n46       (11)\n\nformat           | entries | bytes\nquadruples       | 12      | 156\ntriples          | 12      | 108\nindirect triples | 12      | 156\n",
      "parsed": {
        "quadruples": [
          {
            "index": "(0)",
            "op": "*",
            "arg1": "4",
            "arg2": "5",
            "result": "t1",
            "label": "",
            "raw": "(0)    *       4       5       t1"
          },
          {
            "index": "(1)",
            "op": "=",
            "arg1": "t1",
            "arg2": "x",
            "result": "",
            "label": "",
            "raw": "(1)    =       t1              x"
          },
          {
            "index": "(2)",
            "op": "+",
            "arg1": "x",
            "arg2": "3",
            "result": "t2",
            "label": "",
            "raw": "(2)    +       x       3       t2"
          },
          {
            "index": "(3)",
            "op": "=",
            "arg1": "t2",
            "arg2": "y",
            "result": "",
            "label": "",
            "raw": "(3)    =       t2              y"
          },
          {
            "index": "(4)",
            "op": "*",
            "arg1": "a",
            "arg2": "8",
            "result": "t3",
            "label": "",
            "raw": "(4)    *       a       8       t3"
          },
          {
            "index": "(5)",
            "op": "=",
            "arg1": "t3",
            "arg2": "z",
            "result": "",
            "label": "",
            "raw": "(5)    =       t3              z"
          },
          {
            "index": "(6)",
            "op": "+",
            "arg1": "b",
            "arg2": "c",
            "result": "t4",
            "label": "",
            "raw": "(6)    +       b       c       t4"
          },
          {
            "index": "(7)",
            "op": "=",
            "arg1": "t4",
            "arg2": "w",
            "result": "",
            "label": "",
            "raw": "(7)    =       t4              w"
          },
          {
            "index": "(8)",
            "op": "+",
            "arg1": "b",
            "arg2": "c",
            "result": "t5",
            "label": "",
            "raw": "(8)    +       b       c       t5"
          },
          {
            "index": "(9)",
            "op": "=",
            "arg1": "t5",
            "arg2": "u",
            "result": "",
            "label": "",
            "raw": "(9)    =       t5              u"
          },
          {
            "index": "(10)",
            "op": "*",
            "arg1": "y",
            "arg2": "2",
            "result": "t6",
            "label": "",
            "raw": "(10)   *       y       2       t6"
          },
          {
            "index": "(11)",
            "op": "=",
            "arg1": "t6",
            "arg2": "k",
            "result": "",
            "label": "",
            "raw": "(11)   =       t6              k"
          }
        ],
        "triples": [
          {
            "index": "(0)",
            "op": "*",
            "arg1": "4",
            "arg2": "5",
            "label": "",
            "raw": "(0)    *       4       5"
          },
          {
            "index": "(1)",
            "op": "=",
            "arg1": "x",
            "arg2": "(0)",
            "label": "",
            "raw": "(1)    =       x       (0)"
          },
          {
            "index": "(2)",
            "op": "+",
            "arg1": "x",
            "arg2": "3",
            "label": "",
            "raw": "(2)    +       x       3"
          },
          {
            "index": "(3)",
            "op": "=",
            "arg1": "y",
            "arg2": "(2)",
            "label": "",
            "raw": "(3)    =       y       (2)"
          },
          {
            "index": "(4)",
            "op": "*",
            "arg1": "a",
            "arg2": "8",
            "label": "",
            "raw": "(4)    *       a       8"
          },
          {
            "index": "(5)",
            "op": "=",
            "arg1": "z",
            "arg2": "(4)",
            "label": "",
            "raw": "(5)    =       z       (4)"
          },
          {
            "index": "(6)",
            "op": "+",
            "arg1": "b",
            "arg2": "c",
            "label": "",
            "raw": "(6)    +       b       c"
          },
          {
            "index": "(7)",
            "op": "=",
            "arg1": "w",
            "arg2": "(6)",
            "label": "",
            "raw": "(7)    =       w       (6)"
          },
          {
            "index": "(8)",
            "op": "+",
            "arg1": "b",
            "arg2": "c",
            "label": "",
            "raw": "(8)    +       b       c"
          },
          {
            "index": "(9)",
            "op": "=",
            "arg1": "u",
            "arg2": "(8)",
            "label": "",
            "raw": "(9)    =       u       (8)"
          },
          {
            "index": "(10)",
            "op": "*",
            "arg1": "y",
            "arg2": "2",
            "label": "",
            "raw": "(10)   *       y       2"
          },
          {
            "index": "(11)",
            "op": "=",
            "arg1": "k",
            "arg2": "(10)",
            "label": "",
            "raw": "(11)   =       k       (10)"
          }
        ],
        "indirect_triples": [
          {
            "pointer": "35",
            "target": "(0)"
          },
          {
            "pointer": "36",
            "target": "(1)"
          },
          {
            "pointer": "37",
            "target": "(2)"
          },
          {
            "pointer": "38",
            "target": "(3)"
          },
          {
            "pointer": "39",
            "target": "(4)"
          },
          {
            "pointer": "40",
            "target": "(5)"
          },
          {
            "pointer": "41",
            "target": "(6)"
          },
          {
            "pointer": "42",
            "target": "(7)"
          },
          {
            "pointer": "43",
            "target": "(8)"
          },
          {
            "pointer": "44",
            "target": "(9)"
          },
          {
            "pointer": "45",
            "target": "(10)"
          },
          {
            "pointer": "46",
            "target": "(11)"
          }
        ],
        "summary": [
          {
            "format": "quadruples",
            "entries": 12,
            "bytes": 156
          },
          {
            "format": "triples",
            "entries": 12,
            "bytes": 108
          },
          {
            "format": "indirect triples",
            "entries": 12,
            "bytes": 156
          }
        ]
      },
      "edit_demo": null
    },
    "blocks": {
      "raw": "B1 [1-12] labels=- pred=- succ=-\n    t1 = 4 * 5\n    x = t1\n    t2 = x + 3\n    y = t2\n    t3 = a * 8\n    z = t3\n    t4 = b + c\n    w = t4\n    t5 = b + c\n    u = t5\n    t6 = y * 2\n    k = t6\nback edges: none\nblocks=1 edges=0 back_edges=0\n",
      "parsed": {
        "blocks": [
          {
            "id": "B1",
            "range": "[1-12]",
            "labels": "",
            "pred": [],
            "succ": [],
            "instrs": [
              "t1 = 4 * 5",
              "x = t1",
              "t2 = x + 3",
              "y = t2",
              "t3 = a * 8",
              "z = t3",
              "t4 = b + c",
              "w = t4",
              "t5 = b + c",
              "u = t5",
              "t6 = y * 2",
              "k = t6"
            ]
          }
        ],
        "summary": {
          "blocks": 1,
          "edges": 0,
          "back_edges": 0
        },
        "back_edges": []
      }
    },
    "cfg": {
      "dot": "digraph CFG {\n  node [shape=box, fontname=\"Courier\"];\n  edge [fontname=\"Courier\"];\n\n  B1 [label=\"B1\\lt1 = 4 * 5\\lx = t1\\lt2 = x + 3\\ly = t2\\lt3 = a * 8\\lz = t3\\lt4 = b + c\\lw = t4\\lt5 = b + c\\lu = t5\\lt6 = y * 2\\lk = t6\\l\"];\n\n}\n",
      "svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\"\n \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<!-- Generated by graphviz version 14.1.2 (0)\n -->\n<!-- Title: CFG Pages: 1 -->\n<svg width=\"107pt\" height=\"240pt\"\n viewBox=\"0.00 0.00 107.00 240.00\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n<g id=\"graph0\" class=\"graph\" transform=\"scale(1 1) rotate(0) translate(4 236.25)\">\n<title>CFG</title>\n<polygon fill=\"white\" stroke=\"none\" points=\"-4,4 -4,-236.25 102.5,-236.25 102.5,4 -4,4\"/>\n<!-- B1 -->\n<g id=\"node1\" class=\"node\">\n<title>B1</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"98.5,-232.25 0,-232.25 0,0 98.5,0 98.5,-232.25\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-214.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">B1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-197.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t1 = 4 * 5</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-180.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">x = t1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-163.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t2 = x + 3</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-145.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">y = t2</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-128.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t3 = a * 8</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-111.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">z = t3</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-94.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t4 = b + c</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-76.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">w = t4</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-59.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t5 = b + c</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-42.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">u = t5</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-25.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t6 = y * 2</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-7.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">k = t6</text>\n</g>\n</g>\n</svg>\n",
      "svg_url": "assets/cfg/b2.svg",
      "png_url": "assets/cfg/b2.png"
    },
    "opt": {
      "raw": "No. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 12\n1   | Constant folding and propagation | 6       | 12\n2   | Strength reduction               | 1       | 12\n3   | CSE by local value numbering     | 1       | 12\n4   | Copy propagation                 | 1       | 12\n5   | Dead-code elimination            | 6       | 6\n6   | Temporary coalescing             | 5       | 4\n\noptimized code:\nB1:\n    y = 23\n    z = a << 3\n    w = b + c\n    u = w\ninstructions: 12 -> 4   temporaries remaining: 0   liveness iterations: 2\n",
      "parsed": {
        "pass_table": [
          {
            "pass_num": 0,
            "name": "Unoptimized",
            "changes": 0,
            "instrs_after": 12
          },
          {
            "pass_num": 1,
            "name": "Constant folding and propagation",
            "changes": 6,
            "instrs_after": 12
          },
          {
            "pass_num": 2,
            "name": "Strength reduction",
            "changes": 1,
            "instrs_after": 12
          },
          {
            "pass_num": 3,
            "name": "CSE by local value numbering",
            "changes": 1,
            "instrs_after": 12
          },
          {
            "pass_num": 4,
            "name": "Copy propagation",
            "changes": 1,
            "instrs_after": 12
          },
          {
            "pass_num": 5,
            "name": "Dead-code elimination",
            "changes": 6,
            "instrs_after": 6
          },
          {
            "pass_num": 6,
            "name": "Temporary coalescing",
            "changes": 5,
            "instrs_after": 4
          }
        ],
        "optimized_code": "B1:\n    y = 23\n    z = a << 3\n    w = b + c\n    u = w",
        "summary": "instructions: 12 -> 4   temporaries remaining: 0   liveness iterations: 2"
      }
    },
    "ssa": {
      "raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\n\nB1:\n    t1 = 4 * 5\n    x1 = t1\n    t2 = x1 + 3\n    y1 = t2\n    t3 = a * 8\n    z1 = t3\n    t4 = b + c\n    w1 = t4\n    t5 = b + c\n    u1 = t5\n    t6 = y1 * 2\n    k1 = t6\n    exit_use x1, y1, z1, w1, u1, k1\nphis_unpruned=0 phis_pruned=0\nverify: OK\n",
      "parsed": {
        "dom_table": [
          {
            "block": "B1",
            "idom": "-",
            "df": "{}",
            "phis": ""
          }
        ],
        "ssa_code": "B1:\n    t1 = 4 * 5\n    x1 = t1\n    t2 = x1 + 3\n    y1 = t2\n    t3 = a * 8\n    z1 = t3\n    t4 = b + c\n    w1 = t4\n    t5 = b + c\n    u1 = t5\n    t6 = y1 * 2\n    k1 = t6\n    exit_use x1, y1, z1, w1, u1, k1",
        "summary": "phis_unpruned=0 phis_pruned=0",
        "verify": "verify: OK"
      },
      "unpruned_raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\n\nB1:\n    t1 = 4 * 5\n    x1 = t1\n    t2 = x1 + 3\n    y1 = t2\n    t3 = a * 8\n    z1 = t3\n    t4 = b + c\n    w1 = t4\n    t5 = b + c\n    u1 = t5\n    t6 = y1 * 2\n    k1 = t6\n    exit_use x1, y1, z1, w1, u1, k1\nphis_unpruned=0 phis_pruned=0\nverify: OK\n"
    },
    "ssa_opt": {
      "raw": "B1:\n    t3 = a << 3\n    t4 = b + c\n    t5 = b + c\n    exit_use t5, t4, 23, t3\nssa instrs: 12 -> 3   rounds: 3   copies propagated: 6   phis removed: 0   dataflow iterations: 0\nverify: OK\n",
      "parsed": {
        "code": "B1:\n    t3 = a << 3\n    t4 = b + c\n    t5 = b + c\n    exit_use t5, t4, 23, t3",
        "summary": "ssa instrs: 12 -> 3   rounds: 3   copies propagated: 6   phis removed: 0   dataflow iterations: 0",
        "verify": "verify: OK"
      }
    },
    "braun": {
      "raw": "B1:\n    t1 = 4 * 5\n    x1 = t1\n    t2 = x1 + 3\n    y1 = t2\n    t3 = a * 8\n    z1 = t3\n    t4 = b + c\n    w1 = t4\n    t5 = b + c\n    u1 = t5\n    t6 = y1 * 2\n    k1 = t6\n    exit_use u1, w1, y1, z1\nphis_braun=0\nverify: OK\n"
    },
    "compare": {
      "raw": "phis_cytron_pruned=0 phis_braun=0 MATCH\nverify: OK\n"
    },
    "metrics": {
      "raw": "metric                        | value\n------------------------------+--------------------------------------\ntac_instrs                    | 12\ntemps_created                 | 6\nlabels                        | 0\nblocks                        | 1\nedges                         | 0\nback_edges                    | 0\nquad_entries                  | 12\nquad_bytes                    | 156\ntriple_entries                | 12\ntriple_bytes                  | 108\nindirect_entries              | 12\nindirect_bytes                | 156\ndel_shift_total_quad          | 0\ndel_shift_total_triple        | 66\ndel_shift_total_indirect      | 0\ndel_rewrite_total_quad        | 0\ndel_rewrite_total_triple      | 30\ndel_rewrite_total_indirect    | 0\nopt_instrs_after              | 4\nopt_temps_remaining           | 0\nliveness_iterations           | 2\nphis_unpruned                 | 0\nphis_pruned                   | 0\nphis_braun                    | 0\nssa_instrs_before_opt         | 12\nssa_instrs_after_opt          | 3\nssa_opt_rounds                | 3\ntime_frontend_us_min          | 56.23 (indicative only)\ntime_frontend_us_mean         | 65.70 (indicative only)\ntime_cfg_us_min               | 16.75 (indicative only)\ntime_cfg_us_mean              | 19.41 (indicative only)\ntime_opt_us_min               | 89.64 (indicative only)\ntime_opt_us_mean              | 100.74 (indicative only)\ntime_ssa_us_min               | 96.46 (indicative only)\ntime_ssa_us_mean              | 103.39 (indicative only)\ntime_ssaopt_us_min            | 59.81 (indicative only)\ntime_ssaopt_us_mean           | 67.67 (indicative only)\n",
      "parsed": {
        "tac_instrs": "12",
        "temps_created": "6",
        "labels": "0",
        "blocks": "1",
        "edges": "0",
        "back_edges": "0",
        "quad_entries": "12",
        "quad_bytes": "156",
        "triple_entries": "12",
        "triple_bytes": "108",
        "indirect_entries": "12",
        "indirect_bytes": "156",
        "del_shift_total_quad": "0",
        "del_shift_total_triple": "66",
        "del_shift_total_indirect": "0",
        "del_rewrite_total_quad": "0",
        "del_rewrite_total_triple": "30",
        "del_rewrite_total_indirect": "0",
        "opt_instrs_after": "4",
        "opt_temps_remaining": "0",
        "liveness_iterations": "2",
        "phis_unpruned": "0",
        "phis_pruned": "0",
        "phis_braun": "0",
        "ssa_instrs_before_opt": "12",
        "ssa_instrs_after_opt": "3",
        "ssa_opt_rounds": "3",
        "time_frontend_us_min": "56.23",
        "time_frontend_us_mean": "65.70",
        "time_cfg_us_min": "16.75",
        "time_cfg_us_mean": "19.41",
        "time_opt_us_min": "89.64",
        "time_opt_us_mean": "100.74",
        "time_ssa_us_min": "96.46",
        "time_ssa_us_mean": "103.39",
        "time_ssaopt_us_min": "59.81",
        "time_ssaopt_us_mean": "67.67"
      }
    },
    "all": {
      "raw": "=== TAC ===\n1: t1 = 4 * 5\n2: x = t1\n3: t2 = x + 3\n4: y = t2\n5: t3 = a * 8\n6: z = t3\n7: t4 = b + c\n8: w = t4\n9: t5 = b + c\n10: u = t5\n11: t6 = y * 2\n12: k = t6\ninstructions=12 temporaries=6 labels=0\n\n=== FORMATS ===\nQUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    *       4       5       t1      \n(1)    =       t1              x       \n(2)    +       x       3       t2      \n(3)    =       t2              y       \n(4)    *       a       8       t3      \n(5)    =       t3              z       \n(6)    +       b       c       t4      \n(7)    =       t4              w       \n(8)    +       b       c       t5      \n(9)    =       t5              u       \n(10)   *       y       2       t6      \n(11)   =       t6              k       \n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    *       4       5       \n(1)    =       x       (0)     \n(2)    +       x       3       \n(3)    =       y       (2)     \n(4)    *       a       8       \n(5)    =       z       (4)     \n(6)    +       b       c       \n(7)    =       w       (6)     \n(8)    +       b       c       \n(9)    =       u       (8)     \n(10)   *       y       2       \n(11)   =       k       (10)    \n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n41       (6)\n42       (7)\n43       (8)\n44       (9)\n45       (10)\n46       (11)\n\nformat           | entries | bytes\nquadruples       | 12      | 156\ntriples          | 12      | 108\nindirect triples | 12      | 156\n\n=== BLOCKS & CFG ===\nB1 [1-12] labels=- pred=- succ=-\n    t1 = 4 * 5\n    x = t1\n    t2 = x + 3\n    y = t2\n    t3 = a * 8\n    z = t3\n    t4 = b + c\n    w = t4\n    t5 = b + c\n    u = t5\n    t6 = y * 2\n    k = t6\nback edges: none\nblocks=1 edges=0 back_edges=0\n\n=== OPTIMIZATION ===\nNo. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 12\n1   | Constant folding and propagation | 6       | 12\n2   | Strength reduction               | 1       | 12\n3   | CSE by local value numbering     | 1       | 12\n4   | Copy propagation                 | 1       | 12\n5   | Dead-code elimination            | 6       | 6\n6   | Temporary coalescing             | 5       | 4\n\noptimized code:\nB1:\n    y = 23\n    z = a << 3\n    w = b + c\n    u = w\ninstructions: 12 -> 4   temporaries remaining: 0   liveness iterations: 2\n\n=== SSA ===\nBlock | idom | DF     | phi placed for\nB1    | -    | {}     | -\n\nB1:\n    t1 = 4 * 5\n    x1 = t1\n    t2 = x1 + 3\n    y1 = t2\n    t3 = a * 8\n    z1 = t3\n    t4 = b + c\n    w1 = t4\n    t5 = b + c\n    u1 = t5\n    t6 = y1 * 2\n    k1 = t6\n    exit_use u1, w1, y1, z1\nphis_unpruned=0 phis_pruned=0\nverify: OK\n\n=== SSA OPTIMIZER ===\nB1:\n    t3 = a << 3\n    t4 = b + c\n    t5 = b + c\n    exit_use t5, t4, 23, t3\nssa instrs: 12 -> 3   rounds: 3   copies propagated: 6   phis removed: 0   dataflow iterations: 0\nverify: OK\n"
    }
  },
  "b3": {
    "id": "b3",
    "name": "b3: Common Subexpressions & Storage Formats",
    "file": "bench/b3.mini",
    "description": "Expression evaluation (a = b * -c + b * -c) from Stage-2 Report (Table 10). Used to compare mutation costs across Quadruples, Triples, and Indirect Triples during subexpression elimination.",
    "source": "int a;\na = b * -c + b * -c;\n",
    "tokens": {
      "raw": "LINE  CLASS          LEXEME\n1     KEYWORD        int\n1     ID             a\n1     DELIM          ;\n2     ID             a\n2     ARITH/ASSIGN   =\n2     ID             b\n2     ARITH/ASSIGN   *\n2     ARITH/ASSIGN   -\n2     ID             c\n2     ARITH/ASSIGN   +\n2     ID             b\n2     ARITH/ASSIGN   *\n2     ARITH/ASSIGN   -\n2     ID             c\n2     DELIM          ;\n",
      "parsed": []
    },
    "ast": {
      "raw": "Program (line 1)\n  Decl a (line 1)\n  Assign a (line 2)\n    BinOp +\n      BinOp *\n        Var b\n        UnOp -\n          Var c\n      BinOp *\n        Var b\n        UnOp -\n          Var c\n"
    },
    "tac": {
      "raw": "1: t1 = minus c\n2: t2 = b * t1\n3: t3 = minus c\n4: t4 = b * t3\n5: t5 = t2 + t4\n6: a = t5\ninstructions=6 temporaries=5 labels=0\n",
      "parsed": {
        "instructions": [
          {
            "num": 1,
            "label": "",
            "code": "t1 = minus c",
            "raw": "1: t1 = minus c"
          },
          {
            "num": 2,
            "label": "",
            "code": "t2 = b * t1",
            "raw": "2: t2 = b * t1"
          },
          {
            "num": 3,
            "label": "",
            "code": "t3 = minus c",
            "raw": "3: t3 = minus c"
          },
          {
            "num": 4,
            "label": "",
            "code": "t4 = b * t3",
            "raw": "4: t4 = b * t3"
          },
          {
            "num": 5,
            "label": "",
            "code": "t5 = t2 + t4",
            "raw": "5: t5 = t2 + t4"
          },
          {
            "num": 6,
            "label": "",
            "code": "a = t5",
            "raw": "6: a = t5"
          }
        ],
        "summary": "instructions=6 temporaries=5 labels=0"
      }
    },
    "formats": {
      "raw": "QUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    minus   c               t1      \n(1)    *       b       t1      t2      \n(2)    minus   c               t3      \n(3)    *       b       t3      t4      \n(4)    +       t2      t4      t5      \n(5)    =       t5              a       \n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    minus   c               \n(1)    *       b       (0)     \n(2)    minus   c               \n(3)    *       b       (2)     \n(4)    +       (1)     (3)     \n(5)    =       a       (4)     \n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n\nformat           | entries | bytes\nquadruples       | 6       | 78\ntriples          | 6       | 54\nindirect triples | 6       | 78\n",
      "parsed": {
        "quadruples": [
          {
            "index": "(0)",
            "op": "minus",
            "arg1": "c",
            "arg2": "t1",
            "result": "",
            "label": "",
            "raw": "(0)    minus   c               t1"
          },
          {
            "index": "(1)",
            "op": "*",
            "arg1": "b",
            "arg2": "t1",
            "result": "t2",
            "label": "",
            "raw": "(1)    *       b       t1      t2"
          },
          {
            "index": "(2)",
            "op": "minus",
            "arg1": "c",
            "arg2": "t3",
            "result": "",
            "label": "",
            "raw": "(2)    minus   c               t3"
          },
          {
            "index": "(3)",
            "op": "*",
            "arg1": "b",
            "arg2": "t3",
            "result": "t4",
            "label": "",
            "raw": "(3)    *       b       t3      t4"
          },
          {
            "index": "(4)",
            "op": "+",
            "arg1": "t2",
            "arg2": "t4",
            "result": "t5",
            "label": "",
            "raw": "(4)    +       t2      t4      t5"
          },
          {
            "index": "(5)",
            "op": "=",
            "arg1": "t5",
            "arg2": "a",
            "result": "",
            "label": "",
            "raw": "(5)    =       t5              a"
          }
        ],
        "triples": [
          {
            "index": "(0)",
            "op": "minus",
            "arg1": "c",
            "arg2": "",
            "label": "",
            "raw": "(0)    minus   c"
          },
          {
            "index": "(1)",
            "op": "*",
            "arg1": "b",
            "arg2": "(0)",
            "label": "",
            "raw": "(1)    *       b       (0)"
          },
          {
            "index": "(2)",
            "op": "minus",
            "arg1": "c",
            "arg2": "",
            "label": "",
            "raw": "(2)    minus   c"
          },
          {
            "index": "(3)",
            "op": "*",
            "arg1": "b",
            "arg2": "(2)",
            "label": "",
            "raw": "(3)    *       b       (2)"
          },
          {
            "index": "(4)",
            "op": "+",
            "arg1": "(1)",
            "arg2": "(3)",
            "label": "",
            "raw": "(4)    +       (1)     (3)"
          },
          {
            "index": "(5)",
            "op": "=",
            "arg1": "a",
            "arg2": "(4)",
            "label": "",
            "raw": "(5)    =       a       (4)"
          }
        ],
        "indirect_triples": [
          {
            "pointer": "35",
            "target": "(0)"
          },
          {
            "pointer": "36",
            "target": "(1)"
          },
          {
            "pointer": "37",
            "target": "(2)"
          },
          {
            "pointer": "38",
            "target": "(3)"
          },
          {
            "pointer": "39",
            "target": "(4)"
          },
          {
            "pointer": "40",
            "target": "(5)"
          }
        ],
        "summary": [
          {
            "format": "quadruples",
            "entries": 6,
            "bytes": 78
          },
          {
            "format": "triples",
            "entries": 6,
            "bytes": 54
          },
          {
            "format": "indirect triples",
            "entries": 6,
            "bytes": 78
          }
        ]
      },
      "edit_demo": {
        "raw": "edit                        | quadruples | triples | indirect triples\ninstructions removed:       2 | 2 | 2\noperand fields rewritten:   2 | 3 | 2\nsurviving indices changed:  0 | 2 | 0\n"
      }
    },
    "blocks": {
      "raw": "B1 [1-6] labels=- pred=- succ=-\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a = t5\nback edges: none\nblocks=1 edges=0 back_edges=0\n",
      "parsed": {
        "blocks": [
          {
            "id": "B1",
            "range": "[1-6]",
            "labels": "",
            "pred": [],
            "succ": [],
            "instrs": [
              "t1 = minus c",
              "t2 = b * t1",
              "t3 = minus c",
              "t4 = b * t3",
              "t5 = t2 + t4",
              "a = t5"
            ]
          }
        ],
        "summary": {
          "blocks": 1,
          "edges": 0,
          "back_edges": 0
        },
        "back_edges": []
      }
    },
    "cfg": {
      "dot": "digraph CFG {\n  node [shape=box, fontname=\"Courier\"];\n  edge [fontname=\"Courier\"];\n\n  B1 [label=\"B1\\lt1 = minus c\\lt2 = b * t1\\lt3 = minus c\\lt4 = b * t3\\lt5 = t2 + t4\\la = t5\\l\"];\n\n}\n",
      "svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\"\n \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<!-- Generated by graphviz version 14.1.2 (0)\n -->\n<!-- Title: CFG Pages: 1 -->\n<svg width=\"123pt\" height=\"137pt\"\n viewBox=\"0.00 0.00 123.00 137.00\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n<g id=\"graph0\" class=\"graph\" transform=\"scale(1 1) rotate(0) translate(4 132.75)\">\n<title>CFG</title>\n<polygon fill=\"white\" stroke=\"none\" points=\"-4,4 -4,-132.75 119,-132.75 119,4 -4,4\"/>\n<!-- B1 -->\n<g id=\"node1\" class=\"node\">\n<title>B1</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"115,-128.75 0,-128.75 0,0 115,0 115,-128.75\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-111.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">B1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-94.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t1 = minus c</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-76.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">t2 = b * t1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-59.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t3 = minus c</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-42.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t4 = b * t3</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-25.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t5 = t2 + t4</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-7.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">a = t5</text>\n</g>\n</g>\n</svg>\n",
      "svg_url": "assets/cfg/b3.svg",
      "png_url": "assets/cfg/b3.png"
    },
    "opt": {
      "raw": "No. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 6\n1   | Constant folding and propagation | 0       | 6\n2   | Strength reduction               | 0       | 6\n3   | CSE by local value numbering     | 2       | 6\n4   | Copy propagation                 | 1       | 6\n5   | Dead-code elimination            | 2       | 4\n6   | Temporary coalescing             | 2       | 3\n\noptimized code:\nB1:\n    t1 = minus c\n    t2 = b * t1\n    a = t2 + t2\ninstructions: 6 -> 3   temporaries remaining: 2   liveness iterations: 2\n",
      "parsed": {
        "pass_table": [
          {
            "pass_num": 0,
            "name": "Unoptimized",
            "changes": 0,
            "instrs_after": 6
          },
          {
            "pass_num": 1,
            "name": "Constant folding and propagation",
            "changes": 0,
            "instrs_after": 6
          },
          {
            "pass_num": 2,
            "name": "Strength reduction",
            "changes": 0,
            "instrs_after": 6
          },
          {
            "pass_num": 3,
            "name": "CSE by local value numbering",
            "changes": 2,
            "instrs_after": 6
          },
          {
            "pass_num": 4,
            "name": "Copy propagation",
            "changes": 1,
            "instrs_after": 6
          },
          {
            "pass_num": 5,
            "name": "Dead-code elimination",
            "changes": 2,
            "instrs_after": 4
          },
          {
            "pass_num": 6,
            "name": "Temporary coalescing",
            "changes": 2,
            "instrs_after": 3
          }
        ],
        "optimized_code": "B1:\n    t1 = minus c\n    t2 = b * t1\n    a = t2 + t2",
        "summary": "instructions: 6 -> 3   temporaries remaining: 2   liveness iterations: 2"
      }
    },
    "ssa": {
      "raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\n\nB1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a1 = t5\n    exit_use a1\nphis_unpruned=0 phis_pruned=0\nverify: OK\n",
      "parsed": {
        "dom_table": [
          {
            "block": "B1",
            "idom": "-",
            "df": "{}",
            "phis": ""
          }
        ],
        "ssa_code": "B1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a1 = t5\n    exit_use a1",
        "summary": "phis_unpruned=0 phis_pruned=0",
        "verify": "verify: OK"
      },
      "unpruned_raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\n\nB1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a1 = t5\n    exit_use a1\nphis_unpruned=0 phis_pruned=0\nverify: OK\n"
    },
    "ssa_opt": {
      "raw": "B1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    exit_use t5\nssa instrs: 6 -> 5   rounds: 1   copies propagated: 1   phis removed: 0   dataflow iterations: 0\nverify: OK\n",
      "parsed": {
        "code": "B1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    exit_use t5",
        "summary": "ssa instrs: 6 -> 5   rounds: 1   copies propagated: 1   phis removed: 0   dataflow iterations: 0",
        "verify": "verify: OK"
      }
    },
    "braun": {
      "raw": "B1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a1 = t5\n    exit_use a1\nphis_braun=0\nverify: OK\n"
    },
    "compare": {
      "raw": "phis_cytron_pruned=0 phis_braun=0 MATCH\nverify: OK\n"
    },
    "metrics": {
      "raw": "metric                        | value\n------------------------------+--------------------------------------\ntac_instrs                    | 6\ntemps_created                 | 5\nlabels                        | 0\nblocks                        | 1\nedges                         | 0\nback_edges                    | 0\nquad_entries                  | 6\nquad_bytes                    | 78\ntriple_entries                | 6\ntriple_bytes                  | 54\nindirect_entries              | 6\nindirect_bytes                | 78\ndel_shift_total_quad          | 0\ndel_shift_total_triple        | 15\ndel_shift_total_indirect      | 0\ndel_rewrite_total_quad        | 0\ndel_rewrite_total_triple      | 10\ndel_rewrite_total_indirect    | 0\nopt_instrs_after              | 3\nopt_temps_remaining           | 2\nliveness_iterations           | 2\nphis_unpruned                 | 0\nphis_pruned                   | 0\nphis_braun                    | 0\nssa_instrs_before_opt         | 6\nssa_instrs_after_opt          | 5\nssa_opt_rounds                | 1\ntime_frontend_us_min          | 21.12 (indicative only)\ntime_frontend_us_mean         | 26.11 (indicative only)\ntime_cfg_us_min               | 10.47 (indicative only)\ntime_cfg_us_mean              | 11.43 (indicative only)\ntime_opt_us_min               | 48.13 (indicative only)\ntime_opt_us_mean              | 53.00 (indicative only)\ntime_ssa_us_min               | 37.26 (indicative only)\ntime_ssa_us_mean              | 39.31 (indicative only)\ntime_ssaopt_us_min            | 16.30 (indicative only)\ntime_ssaopt_us_mean           | 17.21 (indicative only)\n",
      "parsed": {
        "tac_instrs": "6",
        "temps_created": "5",
        "labels": "0",
        "blocks": "1",
        "edges": "0",
        "back_edges": "0",
        "quad_entries": "6",
        "quad_bytes": "78",
        "triple_entries": "6",
        "triple_bytes": "54",
        "indirect_entries": "6",
        "indirect_bytes": "78",
        "del_shift_total_quad": "0",
        "del_shift_total_triple": "15",
        "del_shift_total_indirect": "0",
        "del_rewrite_total_quad": "0",
        "del_rewrite_total_triple": "10",
        "del_rewrite_total_indirect": "0",
        "opt_instrs_after": "3",
        "opt_temps_remaining": "2",
        "liveness_iterations": "2",
        "phis_unpruned": "0",
        "phis_pruned": "0",
        "phis_braun": "0",
        "ssa_instrs_before_opt": "6",
        "ssa_instrs_after_opt": "5",
        "ssa_opt_rounds": "1",
        "time_frontend_us_min": "21.12",
        "time_frontend_us_mean": "26.11",
        "time_cfg_us_min": "10.47",
        "time_cfg_us_mean": "11.43",
        "time_opt_us_min": "48.13",
        "time_opt_us_mean": "53.00",
        "time_ssa_us_min": "37.26",
        "time_ssa_us_mean": "39.31",
        "time_ssaopt_us_min": "16.30",
        "time_ssaopt_us_mean": "17.21"
      }
    },
    "all": {
      "raw": "=== TAC ===\n1: t1 = minus c\n2: t2 = b * t1\n3: t3 = minus c\n4: t4 = b * t3\n5: t5 = t2 + t4\n6: a = t5\ninstructions=6 temporaries=5 labels=0\n\n=== FORMATS ===\nQUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    minus   c               t1      \n(1)    *       b       t1      t2      \n(2)    minus   c               t3      \n(3)    *       b       t3      t4      \n(4)    +       t2      t4      t5      \n(5)    =       t5              a       \n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    minus   c               \n(1)    *       b       (0)     \n(2)    minus   c               \n(3)    *       b       (2)     \n(4)    +       (1)     (3)     \n(5)    =       a       (4)     \n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n\nformat           | entries | bytes\nquadruples       | 6       | 78\ntriples          | 6       | 54\nindirect triples | 6       | 78\n\n=== BLOCKS & CFG ===\nB1 [1-6] labels=- pred=- succ=-\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a = t5\nback edges: none\nblocks=1 edges=0 back_edges=0\n\n=== OPTIMIZATION ===\nNo. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 6\n1   | Constant folding and propagation | 0       | 6\n2   | Strength reduction               | 0       | 6\n3   | CSE by local value numbering     | 2       | 6\n4   | Copy propagation                 | 1       | 6\n5   | Dead-code elimination            | 2       | 4\n6   | Temporary coalescing             | 2       | 3\n\noptimized code:\nB1:\n    t1 = minus c\n    t2 = b * t1\n    a = t2 + t2\ninstructions: 6 -> 3   temporaries remaining: 2   liveness iterations: 2\n\n=== SSA ===\nBlock | idom | DF     | phi placed for\nB1    | -    | {}     | -\n\nB1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    a1 = t5\n    exit_use a1\nphis_unpruned=0 phis_pruned=0\nverify: OK\n\n=== SSA OPTIMIZER ===\nB1:\n    t1 = minus c\n    t2 = b * t1\n    t3 = minus c\n    t4 = b * t3\n    t5 = t2 + t4\n    exit_use t5\nssa instrs: 6 -> 5   rounds: 1   copies propagated: 1   phis removed: 0   dataflow iterations: 0\nverify: OK\n"
    }
  },
  "b4": {
    "id": "b4",
    "name": "b4: Synthetic Benchmark (Loops, Branches & Arrays)",
    "file": "bench/b4.mini",
    "description": "Complex synthetic program with nested loops, compound boolean branch conditions (|| and &&), array loads, accumulator variables, and 16 virtual temporaries. Validates scalability and dead phi elimination in pruned SSA.",
    "source": "// b4: synthetic benchmark, nested loops, branches, array access, many temporaries\nint n; int i; int j; int sum; int t; int max; int arr;\nsum = 0;\nmax = 0;\ni = 0;\nwhile (i < n) {\n    j = 0;\n    while (j < i && j < 10) {\n        t = arr[j] * 4 + arr[i] * 4;\n        if (t > max || t == 0) {\n            max = t;\n        } else {\n            sum = sum + (t - max) * 2;\n        }\n        j = j + 1;\n    }\n    sum = sum + i * 8 + (i + 1) * 8;\n    i = i + 1;\n}\nreturn sum + max;\n",
    "tokens": {
      "raw": "LINE  CLASS          LEXEME\n2     KEYWORD        int\n2     ID             n\n2     DELIM          ;\n2     KEYWORD        int\n2     ID             i\n2     DELIM          ;\n2     KEYWORD        int\n2     ID             j\n2     DELIM          ;\n2     KEYWORD        int\n2     ID             sum\n2     DELIM          ;\n2     KEYWORD        int\n2     ID             t\n2     DELIM          ;\n2     KEYWORD        int\n2     ID             max\n2     DELIM          ;\n2     KEYWORD        int\n2     ID             arr\n2     DELIM          ;\n3     ID             sum\n3     ARITH/ASSIGN   =\n3     NUM            0\n3     DELIM          ;\n4     ID             max\n4     ARITH/ASSIGN   =\n4     NUM            0\n4     DELIM          ;\n5     ID             i\n5     ARITH/ASSIGN   =\n5     NUM            0\n5     DELIM          ;\n6     KEYWORD        while\n6     DELIM          (\n6     ID             i\n6     RELOP          <\n6     ID             n\n6     DELIM          )\n6     DELIM          {\n7     ID             j\n7     ARITH/ASSIGN   =\n7     NUM            0\n7     DELIM          ;\n8     KEYWORD        while\n8     DELIM          (\n8     ID             j\n8     RELOP          <\n8     ID             i\n8     LOGOP          &&\n8     ID             j\n8     RELOP          <\n8     NUM            10\n8     DELIM          )\n8     DELIM          {\n9     ID             t\n9     ARITH/ASSIGN   =\n9     ID             arr\n9     DELIM          [\n9     ID             j\n9     DELIM          ]\n9     ARITH/ASSIGN   *\n9     NUM            4\n9     ARITH/ASSIGN   +\n9     ID             arr\n9     DELIM          [\n9     ID             i\n9     DELIM          ]\n9     ARITH/ASSIGN   *\n9     NUM            4\n9     DELIM          ;\n10    KEYWORD        if\n10    DELIM          (\n10    ID             t\n10    RELOP          >\n10    ID             max\n10    LOGOP          ||\n10    ID             t\n10    RELOP          ==\n10    NUM            0\n10    DELIM          )\n10    DELIM          {\n11    ID             max\n11    ARITH/ASSIGN   =\n11    ID             t\n11    DELIM          ;\n12    DELIM          }\n12    KEYWORD        else\n12    DELIM          {\n13    ID             sum\n13    ARITH/ASSIGN   =\n13    ID             sum\n13    ARITH/ASSIGN   +\n13    DELIM          (\n13    ID             t\n13    ARITH/ASSIGN   -\n13    ID             max\n13    DELIM          )\n13    ARITH/ASSIGN   *\n13    NUM            2\n13    DELIM          ;\n14    DELIM          }\n15    ID             j\n15    ARITH/ASSIGN   =\n15    ID             j\n15    ARITH/ASSIGN   +\n15    NUM            1\n15    DELIM          ;\n16    DELIM          }\n17    ID             sum\n17    ARITH/ASSIGN   =\n17    ID             sum\n17    ARITH/ASSIGN   +\n17    ID             i\n17    ARITH/ASSIGN   *\n17    NUM            8\n17    ARITH/ASSIGN   +\n17    DELIM          (\n17    ID             i\n17    ARITH/ASSIGN   +\n17    NUM            1\n17    DELIM          )\n17    ARITH/ASSIGN   *\n17    NUM            8\n17    DELIM          ;\n18    ID             i\n18    ARITH/ASSIGN   =\n18    ID             i\n18    ARITH/ASSIGN   +\n18    NUM            1\n18    DELIM          ;\n19    DELIM          }\n20    KEYWORD        return\n20    ID             sum\n20    ARITH/ASSIGN   +\n20    ID             max\n20    DELIM          ;\n",
      "parsed": []
    },
    "ast": {
      "raw": "Program (line 2)\n  Decl n (line 2)\n  Decl i (line 2)\n  Decl j (line 2)\n  Decl sum (line 2)\n  Decl t (line 2)\n  Decl max (line 2)\n  Decl arr (line 2)\n  Assign sum (line 3)\n    Num 0\n  Assign max (line 4)\n    Num 0\n  Assign i (line 5)\n    Num 0\n  While (line 6)\n    RelOp <\n      Var i\n      Var n\n    Block (line 6)\n      Assign j (line 7)\n        Num 0\n      While (line 8)\n        And\n          RelOp <\n            Var j\n            Var i\n          RelOp <\n            Var j\n            Num 10\n        Block (line 8)\n          Assign t (line 9)\n            BinOp +\n              BinOp *\n                ArrayRef arr\n                  Var j\n                Num 4\n              BinOp *\n                ArrayRef arr\n                  Var i\n                Num 4\n          If (line 10)\n            Or\n              RelOp >\n                Var t\n                Var max\n              RelOp ==\n                Var t\n                Num 0\n            Block (line 10)\n              Assign max (line 11)\n                Var t\n            Block (line 12)\n              Assign sum (line 13)\n                BinOp +\n                  Var sum\n                  BinOp *\n                    BinOp -\n                      Var t\n                      Var max\n                    Num 2\n          Assign j (line 15)\n            BinOp +\n              Var j\n              Num 1\n      Assign sum (line 17)\n        BinOp +\n          BinOp +\n            Var sum\n            BinOp *\n              Var i\n              Num 8\n          BinOp *\n            BinOp +\n              Var i\n              Num 1\n            Num 8\n      Assign i (line 18)\n        BinOp +\n          Var i\n          Num 1\n  Return (line 20)\n    BinOp +\n      Var sum\n      Var max\n"
    },
    "tac": {
      "raw": "1: sum = 0\n2: max = 0\n3: i = 0\n4: L1: if i >= n goto L2\n5: j = 0\n6: L3: if j >= i goto L4\n7: if j >= 10 goto L4\n8: t1 = arr[j]\n9: t2 = t1 * 4\n10: t3 = arr[i]\n11: t4 = t3 * 4\n12: t5 = t2 + t4\n13: t = t5\n14: if t > max goto L7\n15: if t != 0 goto L5\n16: L7: max = t\n17: goto L6\n18: L5: t6 = t - max\n19: t7 = t6 * 2\n20: t8 = sum + t7\n21: sum = t8\n22: L6: t9 = j + 1\n23: j = t9\n24: goto L3\n25: L4: t10 = i * 8\n26: t11 = sum + t10\n27: t12 = i + 1\n28: t13 = t12 * 8\n29: t14 = t11 + t13\n30: sum = t14\n31: t15 = i + 1\n32: i = t15\n33: goto L1\n34: L2: t16 = sum + max\n35: return t16\ninstructions=35 temporaries=16 labels=7\n",
      "parsed": {
        "instructions": [
          {
            "num": 1,
            "label": "",
            "code": "sum = 0",
            "raw": "1: sum = 0"
          },
          {
            "num": 2,
            "label": "",
            "code": "max = 0",
            "raw": "2: max = 0"
          },
          {
            "num": 3,
            "label": "",
            "code": "i = 0",
            "raw": "3: i = 0"
          },
          {
            "num": 4,
            "label": "L1",
            "code": "if i >= n goto L2",
            "raw": "4: L1: if i >= n goto L2"
          },
          {
            "num": 5,
            "label": "",
            "code": "j = 0",
            "raw": "5: j = 0"
          },
          {
            "num": 6,
            "label": "L3",
            "code": "if j >= i goto L4",
            "raw": "6: L3: if j >= i goto L4"
          },
          {
            "num": 7,
            "label": "",
            "code": "if j >= 10 goto L4",
            "raw": "7: if j >= 10 goto L4"
          },
          {
            "num": 8,
            "label": "",
            "code": "t1 = arr[j]",
            "raw": "8: t1 = arr[j]"
          },
          {
            "num": 9,
            "label": "",
            "code": "t2 = t1 * 4",
            "raw": "9: t2 = t1 * 4"
          },
          {
            "num": 10,
            "label": "",
            "code": "t3 = arr[i]",
            "raw": "10: t3 = arr[i]"
          },
          {
            "num": 11,
            "label": "",
            "code": "t4 = t3 * 4",
            "raw": "11: t4 = t3 * 4"
          },
          {
            "num": 12,
            "label": "",
            "code": "t5 = t2 + t4",
            "raw": "12: t5 = t2 + t4"
          },
          {
            "num": 13,
            "label": "",
            "code": "t = t5",
            "raw": "13: t = t5"
          },
          {
            "num": 14,
            "label": "",
            "code": "if t > max goto L7",
            "raw": "14: if t > max goto L7"
          },
          {
            "num": 15,
            "label": "",
            "code": "if t != 0 goto L5",
            "raw": "15: if t != 0 goto L5"
          },
          {
            "num": 16,
            "label": "L7",
            "code": "max = t",
            "raw": "16: L7: max = t"
          },
          {
            "num": 17,
            "label": "",
            "code": "goto L6",
            "raw": "17: goto L6"
          },
          {
            "num": 18,
            "label": "L5",
            "code": "t6 = t - max",
            "raw": "18: L5: t6 = t - max"
          },
          {
            "num": 19,
            "label": "",
            "code": "t7 = t6 * 2",
            "raw": "19: t7 = t6 * 2"
          },
          {
            "num": 20,
            "label": "",
            "code": "t8 = sum + t7",
            "raw": "20: t8 = sum + t7"
          },
          {
            "num": 21,
            "label": "",
            "code": "sum = t8",
            "raw": "21: sum = t8"
          },
          {
            "num": 22,
            "label": "L6",
            "code": "t9 = j + 1",
            "raw": "22: L6: t9 = j + 1"
          },
          {
            "num": 23,
            "label": "",
            "code": "j = t9",
            "raw": "23: j = t9"
          },
          {
            "num": 24,
            "label": "",
            "code": "goto L3",
            "raw": "24: goto L3"
          },
          {
            "num": 25,
            "label": "L4",
            "code": "t10 = i * 8",
            "raw": "25: L4: t10 = i * 8"
          },
          {
            "num": 26,
            "label": "",
            "code": "t11 = sum + t10",
            "raw": "26: t11 = sum + t10"
          },
          {
            "num": 27,
            "label": "",
            "code": "t12 = i + 1",
            "raw": "27: t12 = i + 1"
          },
          {
            "num": 28,
            "label": "",
            "code": "t13 = t12 * 8",
            "raw": "28: t13 = t12 * 8"
          },
          {
            "num": 29,
            "label": "",
            "code": "t14 = t11 + t13",
            "raw": "29: t14 = t11 + t13"
          },
          {
            "num": 30,
            "label": "",
            "code": "sum = t14",
            "raw": "30: sum = t14"
          },
          {
            "num": 31,
            "label": "",
            "code": "t15 = i + 1",
            "raw": "31: t15 = i + 1"
          },
          {
            "num": 32,
            "label": "",
            "code": "i = t15",
            "raw": "32: i = t15"
          },
          {
            "num": 33,
            "label": "",
            "code": "goto L1",
            "raw": "33: goto L1"
          },
          {
            "num": 34,
            "label": "L2",
            "code": "t16 = sum + max",
            "raw": "34: L2: t16 = sum + max"
          },
          {
            "num": 35,
            "label": "",
            "code": "return t16",
            "raw": "35: return t16"
          }
        ],
        "summary": "instructions=35 temporaries=16 labels=7"
      }
    },
    "formats": {
      "raw": "QUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    =       0               sum     \n(1)    =       0               max     \n(2)    =       0               i       \n(3)    if>=    i       n       L2      L1\n(4)    =       0               j       \n(5)    if>=    j       i       L4      L3\n(6)    if>=    j       10      L4      \n(7)    =[]     arr     j       t1      \n(8)    *       t1      4       t2      \n(9)    =[]     arr     i       t3      \n(10)   *       t3      4       t4      \n(11)   +       t2      t4      t5      \n(12)   =       t5              t       \n(13)   if>     t       max     L7      \n(14)   if!=    t       0       L5      \n(15)   =       t               max     L7\n(16)   goto                    L6      \n(17)   -       t       max     t6      L5\n(18)   *       t6      2       t7      \n(19)   +       sum     t7      t8      \n(20)   =       t8              sum     \n(21)   +       j       1       t9      L6\n(22)   =       t9              j       \n(23)   goto                    L3      \n(24)   *       i       8       t10     L4\n(25)   +       sum     t10     t11     \n(26)   +       i       1       t12     \n(27)   *       t12     8       t13     \n(28)   +       t11     t13     t14     \n(29)   =       t14             sum     \n(30)   +       i       1       t15     \n(31)   =       t15             i       \n(32)   goto                    L1      \n(33)   +       sum     max     t16     L2\n(34)   return  t16                     \n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    =       sum     0       \n(1)    =       max     0       \n(2)    =       i       0       \n(3)    >=      i       n       L1\n(4)    if      (3)     L2      \n(5)    =       j       0       \n(6)    >=      j       i       L3\n(7)    if      (6)     L4      \n(8)    >=      j       10      \n(9)    if      (8)     L4      \n(10)   =[]     arr     j       \n(11)   *       (10)    4       \n(12)   =[]     arr     i       \n(13)   *       (12)    4       \n(14)   +       (11)    (13)    \n(15)   =       t       (14)    \n(16)   >       t       max     \n(17)   if      (16)    L7      \n(18)   !=      t       0       \n(19)   if      (18)    L5      \n(20)   =       max     t       L7\n(21)   goto            L6      \n(22)   -       t       max     L5\n(23)   *       (22)    2       \n(24)   +       sum     (23)    \n(25)   =       sum     (24)    \n(26)   +       j       1       L6\n(27)   =       j       (26)    \n(28)   goto            L3      \n(29)   *       i       8       L4\n(30)   +       sum     (29)    \n(31)   +       i       1       \n(32)   *       (31)    8       \n(33)   +       (30)    (32)    \n(34)   =       sum     (33)    \n(35)   +       i       1       \n(36)   =       i       (35)    \n(37)   goto            L1      \n(38)   +       sum     max     L2\n(39)   return  (38)            \n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n41       (6)\n42       (7)\n43       (8)\n44       (9)\n45       (10)\n46       (11)\n47       (12)\n48       (13)\n49       (14)\n50       (15)\n51       (16)\n52       (17)\n53       (18)\n54       (19)\n55       (20)\n56       (21)\n57       (22)\n58       (23)\n59       (24)\n60       (25)\n61       (26)\n62       (27)\n63       (28)\n64       (29)\n65       (30)\n66       (31)\n67       (32)\n68       (33)\n69       (34)\n70       (35)\n71       (36)\n72       (37)\n73       (38)\n74       (39)\n\nformat           | entries | bytes\nquadruples       | 35      | 455\ntriples          | 40      | 360\nindirect triples | 40      | 520\n",
      "parsed": {
        "quadruples": [
          {
            "index": "(0)",
            "op": "=",
            "arg1": "0",
            "arg2": "sum",
            "result": "",
            "label": "",
            "raw": "(0)    =       0               sum"
          },
          {
            "index": "(1)",
            "op": "=",
            "arg1": "0",
            "arg2": "max",
            "result": "",
            "label": "",
            "raw": "(1)    =       0               max"
          },
          {
            "index": "(2)",
            "op": "=",
            "arg1": "0",
            "arg2": "i",
            "result": "",
            "label": "",
            "raw": "(2)    =       0               i"
          },
          {
            "index": "(3)",
            "op": "if>=",
            "arg1": "i",
            "arg2": "n",
            "result": "L2",
            "label": "L1",
            "raw": "(3)    if>=    i       n       L2      L1"
          },
          {
            "index": "(4)",
            "op": "=",
            "arg1": "0",
            "arg2": "j",
            "result": "",
            "label": "",
            "raw": "(4)    =       0               j"
          },
          {
            "index": "(5)",
            "op": "if>=",
            "arg1": "j",
            "arg2": "i",
            "result": "L4",
            "label": "L3",
            "raw": "(5)    if>=    j       i       L4      L3"
          },
          {
            "index": "(6)",
            "op": "if>=",
            "arg1": "j",
            "arg2": "10",
            "result": "L4",
            "label": "",
            "raw": "(6)    if>=    j       10      L4"
          },
          {
            "index": "(7)",
            "op": "=[]",
            "arg1": "arr",
            "arg2": "j",
            "result": "t1",
            "label": "",
            "raw": "(7)    =[]     arr     j       t1"
          },
          {
            "index": "(8)",
            "op": "*",
            "arg1": "t1",
            "arg2": "4",
            "result": "t2",
            "label": "",
            "raw": "(8)    *       t1      4       t2"
          },
          {
            "index": "(9)",
            "op": "=[]",
            "arg1": "arr",
            "arg2": "i",
            "result": "t3",
            "label": "",
            "raw": "(9)    =[]     arr     i       t3"
          },
          {
            "index": "(10)",
            "op": "*",
            "arg1": "t3",
            "arg2": "4",
            "result": "t4",
            "label": "",
            "raw": "(10)   *       t3      4       t4"
          },
          {
            "index": "(11)",
            "op": "+",
            "arg1": "t2",
            "arg2": "t4",
            "result": "t5",
            "label": "",
            "raw": "(11)   +       t2      t4      t5"
          },
          {
            "index": "(12)",
            "op": "=",
            "arg1": "t5",
            "arg2": "t",
            "result": "",
            "label": "",
            "raw": "(12)   =       t5              t"
          },
          {
            "index": "(13)",
            "op": "if>",
            "arg1": "t",
            "arg2": "max",
            "result": "L7",
            "label": "",
            "raw": "(13)   if>     t       max     L7"
          },
          {
            "index": "(14)",
            "op": "if!=",
            "arg1": "t",
            "arg2": "0",
            "result": "L5",
            "label": "",
            "raw": "(14)   if!=    t       0       L5"
          },
          {
            "index": "(15)",
            "op": "=",
            "arg1": "t",
            "arg2": "max",
            "result": "L7",
            "label": "",
            "raw": "(15)   =       t               max     L7"
          },
          {
            "index": "(16)",
            "op": "goto",
            "arg1": "L6",
            "arg2": "",
            "result": "",
            "label": "",
            "raw": "(16)   goto                    L6"
          },
          {
            "index": "(17)",
            "op": "-",
            "arg1": "t",
            "arg2": "max",
            "result": "t6",
            "label": "L5",
            "raw": "(17)   -       t       max     t6      L5"
          },
          {
            "index": "(18)",
            "op": "*",
            "arg1": "t6",
            "arg2": "2",
            "result": "t7",
            "label": "",
            "raw": "(18)   *       t6      2       t7"
          },
          {
            "index": "(19)",
            "op": "+",
            "arg1": "sum",
            "arg2": "t7",
            "result": "t8",
            "label": "",
            "raw": "(19)   +       sum     t7      t8"
          },
          {
            "index": "(20)",
            "op": "=",
            "arg1": "t8",
            "arg2": "sum",
            "result": "",
            "label": "",
            "raw": "(20)   =       t8              sum"
          },
          {
            "index": "(21)",
            "op": "+",
            "arg1": "j",
            "arg2": "1",
            "result": "t9",
            "label": "L6",
            "raw": "(21)   +       j       1       t9      L6"
          },
          {
            "index": "(22)",
            "op": "=",
            "arg1": "t9",
            "arg2": "j",
            "result": "",
            "label": "",
            "raw": "(22)   =       t9              j"
          },
          {
            "index": "(23)",
            "op": "goto",
            "arg1": "L3",
            "arg2": "",
            "result": "",
            "label": "",
            "raw": "(23)   goto                    L3"
          },
          {
            "index": "(24)",
            "op": "*",
            "arg1": "i",
            "arg2": "8",
            "result": "t10",
            "label": "L4",
            "raw": "(24)   *       i       8       t10     L4"
          },
          {
            "index": "(25)",
            "op": "+",
            "arg1": "sum",
            "arg2": "t10",
            "result": "t11",
            "label": "",
            "raw": "(25)   +       sum     t10     t11"
          },
          {
            "index": "(26)",
            "op": "+",
            "arg1": "i",
            "arg2": "1",
            "result": "t12",
            "label": "",
            "raw": "(26)   +       i       1       t12"
          },
          {
            "index": "(27)",
            "op": "*",
            "arg1": "t12",
            "arg2": "8",
            "result": "t13",
            "label": "",
            "raw": "(27)   *       t12     8       t13"
          },
          {
            "index": "(28)",
            "op": "+",
            "arg1": "t11",
            "arg2": "t13",
            "result": "t14",
            "label": "",
            "raw": "(28)   +       t11     t13     t14"
          },
          {
            "index": "(29)",
            "op": "=",
            "arg1": "t14",
            "arg2": "sum",
            "result": "",
            "label": "",
            "raw": "(29)   =       t14             sum"
          },
          {
            "index": "(30)",
            "op": "+",
            "arg1": "i",
            "arg2": "1",
            "result": "t15",
            "label": "",
            "raw": "(30)   +       i       1       t15"
          },
          {
            "index": "(31)",
            "op": "=",
            "arg1": "t15",
            "arg2": "i",
            "result": "",
            "label": "",
            "raw": "(31)   =       t15             i"
          },
          {
            "index": "(32)",
            "op": "goto",
            "arg1": "L1",
            "arg2": "",
            "result": "",
            "label": "",
            "raw": "(32)   goto                    L1"
          },
          {
            "index": "(33)",
            "op": "+",
            "arg1": "sum",
            "arg2": "max",
            "result": "t16",
            "label": "L2",
            "raw": "(33)   +       sum     max     t16     L2"
          },
          {
            "index": "(34)",
            "op": "return",
            "arg1": "t16",
            "arg2": "",
            "result": "",
            "label": "",
            "raw": "(34)   return  t16"
          }
        ],
        "triples": [
          {
            "index": "(0)",
            "op": "=",
            "arg1": "sum",
            "arg2": "0",
            "label": "",
            "raw": "(0)    =       sum     0"
          },
          {
            "index": "(1)",
            "op": "=",
            "arg1": "max",
            "arg2": "0",
            "label": "",
            "raw": "(1)    =       max     0"
          },
          {
            "index": "(2)",
            "op": "=",
            "arg1": "i",
            "arg2": "0",
            "label": "",
            "raw": "(2)    =       i       0"
          },
          {
            "index": "(3)",
            "op": ">=",
            "arg1": "i",
            "arg2": "n",
            "label": "L1",
            "raw": "(3)    >=      i       n       L1"
          },
          {
            "index": "(4)",
            "op": "if",
            "arg1": "(3)",
            "arg2": "L2",
            "label": "",
            "raw": "(4)    if      (3)     L2"
          },
          {
            "index": "(5)",
            "op": "=",
            "arg1": "j",
            "arg2": "0",
            "label": "",
            "raw": "(5)    =       j       0"
          },
          {
            "index": "(6)",
            "op": ">=",
            "arg1": "j",
            "arg2": "i",
            "label": "L3",
            "raw": "(6)    >=      j       i       L3"
          },
          {
            "index": "(7)",
            "op": "if",
            "arg1": "(6)",
            "arg2": "L4",
            "label": "",
            "raw": "(7)    if      (6)     L4"
          },
          {
            "index": "(8)",
            "op": ">=",
            "arg1": "j",
            "arg2": "10",
            "label": "",
            "raw": "(8)    >=      j       10"
          },
          {
            "index": "(9)",
            "op": "if",
            "arg1": "(8)",
            "arg2": "L4",
            "label": "",
            "raw": "(9)    if      (8)     L4"
          },
          {
            "index": "(10)",
            "op": "=[]",
            "arg1": "arr",
            "arg2": "j",
            "label": "",
            "raw": "(10)   =[]     arr     j"
          },
          {
            "index": "(11)",
            "op": "*",
            "arg1": "(10)",
            "arg2": "4",
            "label": "",
            "raw": "(11)   *       (10)    4"
          },
          {
            "index": "(12)",
            "op": "=[]",
            "arg1": "arr",
            "arg2": "i",
            "label": "",
            "raw": "(12)   =[]     arr     i"
          },
          {
            "index": "(13)",
            "op": "*",
            "arg1": "(12)",
            "arg2": "4",
            "label": "",
            "raw": "(13)   *       (12)    4"
          },
          {
            "index": "(14)",
            "op": "+",
            "arg1": "(11)",
            "arg2": "(13)",
            "label": "",
            "raw": "(14)   +       (11)    (13)"
          },
          {
            "index": "(15)",
            "op": "=",
            "arg1": "t",
            "arg2": "(14)",
            "label": "",
            "raw": "(15)   =       t       (14)"
          },
          {
            "index": "(16)",
            "op": ">",
            "arg1": "t",
            "arg2": "max",
            "label": "",
            "raw": "(16)   >       t       max"
          },
          {
            "index": "(17)",
            "op": "if",
            "arg1": "(16)",
            "arg2": "L7",
            "label": "",
            "raw": "(17)   if      (16)    L7"
          },
          {
            "index": "(18)",
            "op": "!=",
            "arg1": "t",
            "arg2": "0",
            "label": "",
            "raw": "(18)   !=      t       0"
          },
          {
            "index": "(19)",
            "op": "if",
            "arg1": "(18)",
            "arg2": "L5",
            "label": "",
            "raw": "(19)   if      (18)    L5"
          },
          {
            "index": "(20)",
            "op": "=",
            "arg1": "max",
            "arg2": "t",
            "label": "L7",
            "raw": "(20)   =       max     t       L7"
          },
          {
            "index": "(21)",
            "op": "goto",
            "arg1": "L6",
            "arg2": "",
            "label": "",
            "raw": "(21)   goto            L6"
          },
          {
            "index": "(22)",
            "op": "-",
            "arg1": "t",
            "arg2": "max",
            "label": "L5",
            "raw": "(22)   -       t       max     L5"
          },
          {
            "index": "(23)",
            "op": "*",
            "arg1": "(22)",
            "arg2": "2",
            "label": "",
            "raw": "(23)   *       (22)    2"
          },
          {
            "index": "(24)",
            "op": "+",
            "arg1": "sum",
            "arg2": "(23)",
            "label": "",
            "raw": "(24)   +       sum     (23)"
          },
          {
            "index": "(25)",
            "op": "=",
            "arg1": "sum",
            "arg2": "(24)",
            "label": "",
            "raw": "(25)   =       sum     (24)"
          },
          {
            "index": "(26)",
            "op": "+",
            "arg1": "j",
            "arg2": "1",
            "label": "L6",
            "raw": "(26)   +       j       1       L6"
          },
          {
            "index": "(27)",
            "op": "=",
            "arg1": "j",
            "arg2": "(26)",
            "label": "",
            "raw": "(27)   =       j       (26)"
          },
          {
            "index": "(28)",
            "op": "goto",
            "arg1": "L3",
            "arg2": "",
            "label": "",
            "raw": "(28)   goto            L3"
          },
          {
            "index": "(29)",
            "op": "*",
            "arg1": "i",
            "arg2": "8",
            "label": "L4",
            "raw": "(29)   *       i       8       L4"
          },
          {
            "index": "(30)",
            "op": "+",
            "arg1": "sum",
            "arg2": "(29)",
            "label": "",
            "raw": "(30)   +       sum     (29)"
          },
          {
            "index": "(31)",
            "op": "+",
            "arg1": "i",
            "arg2": "1",
            "label": "",
            "raw": "(31)   +       i       1"
          },
          {
            "index": "(32)",
            "op": "*",
            "arg1": "(31)",
            "arg2": "8",
            "label": "",
            "raw": "(32)   *       (31)    8"
          },
          {
            "index": "(33)",
            "op": "+",
            "arg1": "(30)",
            "arg2": "(32)",
            "label": "",
            "raw": "(33)   +       (30)    (32)"
          },
          {
            "index": "(34)",
            "op": "=",
            "arg1": "sum",
            "arg2": "(33)",
            "label": "",
            "raw": "(34)   =       sum     (33)"
          },
          {
            "index": "(35)",
            "op": "+",
            "arg1": "i",
            "arg2": "1",
            "label": "",
            "raw": "(35)   +       i       1"
          },
          {
            "index": "(36)",
            "op": "=",
            "arg1": "i",
            "arg2": "(35)",
            "label": "",
            "raw": "(36)   =       i       (35)"
          },
          {
            "index": "(37)",
            "op": "goto",
            "arg1": "L1",
            "arg2": "",
            "label": "",
            "raw": "(37)   goto            L1"
          },
          {
            "index": "(38)",
            "op": "+",
            "arg1": "sum",
            "arg2": "max",
            "label": "L2",
            "raw": "(38)   +       sum     max     L2"
          },
          {
            "index": "(39)",
            "op": "return",
            "arg1": "(38)",
            "arg2": "",
            "label": "",
            "raw": "(39)   return  (38)"
          }
        ],
        "indirect_triples": [
          {
            "pointer": "35",
            "target": "(0)"
          },
          {
            "pointer": "36",
            "target": "(1)"
          },
          {
            "pointer": "37",
            "target": "(2)"
          },
          {
            "pointer": "38",
            "target": "(3)"
          },
          {
            "pointer": "39",
            "target": "(4)"
          },
          {
            "pointer": "40",
            "target": "(5)"
          },
          {
            "pointer": "41",
            "target": "(6)"
          },
          {
            "pointer": "42",
            "target": "(7)"
          },
          {
            "pointer": "43",
            "target": "(8)"
          },
          {
            "pointer": "44",
            "target": "(9)"
          },
          {
            "pointer": "45",
            "target": "(10)"
          },
          {
            "pointer": "46",
            "target": "(11)"
          },
          {
            "pointer": "47",
            "target": "(12)"
          },
          {
            "pointer": "48",
            "target": "(13)"
          },
          {
            "pointer": "49",
            "target": "(14)"
          },
          {
            "pointer": "50",
            "target": "(15)"
          },
          {
            "pointer": "51",
            "target": "(16)"
          },
          {
            "pointer": "52",
            "target": "(17)"
          },
          {
            "pointer": "53",
            "target": "(18)"
          },
          {
            "pointer": "54",
            "target": "(19)"
          },
          {
            "pointer": "55",
            "target": "(20)"
          },
          {
            "pointer": "56",
            "target": "(21)"
          },
          {
            "pointer": "57",
            "target": "(22)"
          },
          {
            "pointer": "58",
            "target": "(23)"
          },
          {
            "pointer": "59",
            "target": "(24)"
          },
          {
            "pointer": "60",
            "target": "(25)"
          },
          {
            "pointer": "61",
            "target": "(26)"
          },
          {
            "pointer": "62",
            "target": "(27)"
          },
          {
            "pointer": "63",
            "target": "(28)"
          },
          {
            "pointer": "64",
            "target": "(29)"
          },
          {
            "pointer": "65",
            "target": "(30)"
          },
          {
            "pointer": "66",
            "target": "(31)"
          },
          {
            "pointer": "67",
            "target": "(32)"
          },
          {
            "pointer": "68",
            "target": "(33)"
          },
          {
            "pointer": "69",
            "target": "(34)"
          },
          {
            "pointer": "70",
            "target": "(35)"
          },
          {
            "pointer": "71",
            "target": "(36)"
          },
          {
            "pointer": "72",
            "target": "(37)"
          },
          {
            "pointer": "73",
            "target": "(38)"
          },
          {
            "pointer": "74",
            "target": "(39)"
          }
        ],
        "summary": [
          {
            "format": "quadruples",
            "entries": 35,
            "bytes": 455
          },
          {
            "format": "triples",
            "entries": 40,
            "bytes": 360
          },
          {
            "format": "indirect triples",
            "entries": 40,
            "bytes": 520
          }
        ]
      },
      "edit_demo": null
    },
    "blocks": {
      "raw": "B1 [1-3] labels=- pred=- succ=B2\n    sum = 0\n    max = 0\n    i = 0\nB2 [4-4] labels=L1 pred=B1,B11 succ=B3(i < n),B12(i >= n)\n    if i >= n goto L2\nB3 [5-5] labels=- pred=B2 succ=B4\n    j = 0\nB4 [6-6] labels=L3 pred=B3,B10 succ=B5(j < i),B11(j >= i)\n    if j >= i goto L4\nB5 [7-7] labels=- pred=B4 succ=B6(j < 10),B11(j >= 10)\n    if j >= 10 goto L4\nB6 [8-14] labels=- pred=B5 succ=B7(t <= max),B8(t > max)\n    t1 = arr[j]\n    t2 = t1 * 4\n    t3 = arr[i]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t = t5\n    if t > max goto L7\nB7 [15-15] labels=- pred=B6 succ=B8(t == 0),B9(t != 0)\n    if t != 0 goto L5\nB8 [16-17] labels=L7 pred=B6,B7 succ=B10\n    max = t\n    goto L6\nB9 [18-21] labels=L5 pred=B7 succ=B10\n    t6 = t - max\n    t7 = t6 * 2\n    t8 = sum + t7\n    sum = t8\nB10 [22-24] labels=L6 pred=B8,B9 succ=B4\n    t9 = j + 1\n    j = t9\n    goto L3\nB11 [25-33] labels=L4 pred=B4,B5 succ=B2\n    t10 = i * 8\n    t11 = sum + t10\n    t12 = i + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum = t14\n    t15 = i + 1\n    i = t15\n    goto L1\nB12 [34-35] labels=L2 pred=B2 succ=-\n    t16 = sum + max\n    return t16\nback edges: B10->B4, B11->B2\nblocks=12 edges=16 back_edges=2\n",
      "parsed": {
        "blocks": [
          {
            "id": "B1",
            "range": "[1-3]",
            "labels": "",
            "pred": [],
            "succ": [
              "B2"
            ],
            "instrs": [
              "sum = 0",
              "max = 0",
              "i = 0"
            ]
          },
          {
            "id": "B2",
            "range": "[4-4]",
            "labels": "L1",
            "pred": [
              "B1",
              "B11"
            ],
            "succ": [
              "B3(i < n)",
              "B12(i >= n)"
            ],
            "instrs": [
              "if i >= n goto L2"
            ]
          },
          {
            "id": "B3",
            "range": "[5-5]",
            "labels": "",
            "pred": [
              "B2"
            ],
            "succ": [
              "B4"
            ],
            "instrs": [
              "j = 0"
            ]
          },
          {
            "id": "B4",
            "range": "[6-6]",
            "labels": "L3",
            "pred": [
              "B3",
              "B10"
            ],
            "succ": [
              "B5(j < i)",
              "B11(j >= i)"
            ],
            "instrs": [
              "if j >= i goto L4"
            ]
          },
          {
            "id": "B5",
            "range": "[7-7]",
            "labels": "",
            "pred": [
              "B4"
            ],
            "succ": [
              "B6(j < 10)",
              "B11(j >= 10)"
            ],
            "instrs": [
              "if j >= 10 goto L4"
            ]
          },
          {
            "id": "B6",
            "range": "[8-14]",
            "labels": "",
            "pred": [
              "B5"
            ],
            "succ": [
              "B7(t <= max)",
              "B8(t > max)"
            ],
            "instrs": [
              "t1 = arr[j]",
              "t2 = t1 * 4",
              "t3 = arr[i]",
              "t4 = t3 * 4",
              "t5 = t2 + t4",
              "t = t5",
              "if t > max goto L7"
            ]
          },
          {
            "id": "B7",
            "range": "[15-15]",
            "labels": "",
            "pred": [
              "B6"
            ],
            "succ": [
              "B8(t == 0)",
              "B9(t != 0)"
            ],
            "instrs": [
              "if t != 0 goto L5"
            ]
          },
          {
            "id": "B8",
            "range": "[16-17]",
            "labels": "L7",
            "pred": [
              "B6",
              "B7"
            ],
            "succ": [
              "B10"
            ],
            "instrs": [
              "max = t",
              "goto L6"
            ]
          },
          {
            "id": "B9",
            "range": "[18-21]",
            "labels": "L5",
            "pred": [
              "B7"
            ],
            "succ": [
              "B10"
            ],
            "instrs": [
              "t6 = t - max",
              "t7 = t6 * 2",
              "t8 = sum + t7",
              "sum = t8"
            ]
          },
          {
            "id": "B10",
            "range": "[22-24]",
            "labels": "L6",
            "pred": [
              "B8",
              "B9"
            ],
            "succ": [
              "B4"
            ],
            "instrs": [
              "t9 = j + 1",
              "j = t9",
              "goto L3"
            ]
          },
          {
            "id": "B11",
            "range": "[25-33]",
            "labels": "L4",
            "pred": [
              "B4",
              "B5"
            ],
            "succ": [
              "B2"
            ],
            "instrs": [
              "t10 = i * 8",
              "t11 = sum + t10",
              "t12 = i + 1",
              "t13 = t12 * 8",
              "t14 = t11 + t13",
              "sum = t14",
              "t15 = i + 1",
              "i = t15",
              "goto L1"
            ]
          },
          {
            "id": "B12",
            "range": "[34-35]",
            "labels": "L2",
            "pred": [
              "B2"
            ],
            "succ": [],
            "instrs": [
              "t16 = sum + max",
              "return t16"
            ]
          }
        ],
        "summary": {
          "blocks": 12,
          "edges": 16,
          "back_edges": 2
        },
        "back_edges": [
          "B10->B4",
          "B11->B2"
        ]
      }
    },
    "cfg": {
      "dot": "digraph CFG {\n  node [shape=box, fontname=\"Courier\"];\n  edge [fontname=\"Courier\"];\n\n  B1 [label=\"B1\\lsum = 0\\lmax = 0\\li = 0\\l\"];\n  B2 [label=\"B2 (L1)\\lif i >= n goto L2\\l\"];\n  B3 [label=\"B3\\lj = 0\\l\"];\n  B4 [label=\"B4 (L3)\\lif j >= i goto L4\\l\"];\n  B5 [label=\"B5\\lif j >= 10 goto L4\\l\"];\n  B6 [label=\"B6\\lt1 = arr[j]\\lt2 = t1 * 4\\lt3 = arr[i]\\lt4 = t3 * 4\\lt5 = t2 + t4\\lt = t5\\lif t > max goto L7\\l\"];\n  B7 [label=\"B7\\lif t != 0 goto L5\\l\"];\n  B8 [label=\"B8 (L7)\\lmax = t\\lgoto L6\\l\"];\n  B9 [label=\"B9 (L5)\\lt6 = t - max\\lt7 = t6 * 2\\lt8 = sum + t7\\lsum = t8\\l\"];\n  B10 [label=\"B10 (L6)\\lt9 = j + 1\\lj = t9\\lgoto L3\\l\"];\n  B11 [label=\"B11 (L4)\\lt10 = i * 8\\lt11 = sum + t10\\lt12 = i + 1\\lt13 = t12 * 8\\lt14 = t11 + t13\\lsum = t14\\lt15 = i + 1\\li = t15\\lgoto L1\\l\"];\n  B12 [label=\"B12 (L2)\\lt16 = sum + max\\lreturn t16\\l\"];\n\n  B1 -> B2;\n  B2 -> B3 [label=\"i < n\"];\n  B2 -> B12 [label=\"i >= n\"];\n  B3 -> B4;\n  B4 -> B5 [label=\"j < i\"];\n  B4 -> B11 [label=\"j >= i\"];\n  B5 -> B6 [label=\"j < 10\"];\n  B5 -> B11 [label=\"j >= 10\"];\n  B6 -> B7 [label=\"t <= max\"];\n  B6 -> B8 [label=\"t > max\"];\n  B7 -> B8 [label=\"t == 0\"];\n  B7 -> B9 [label=\"t != 0\"];\n  B8 -> B10;\n  B9 -> B10;\n  B10 -> B4 [color=red];\n  B11 -> B2 [color=red];\n}\n",
      "svg": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\"\n \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<!-- Generated by graphviz version 14.1.2 (0)\n -->\n<!-- Title: CFG Pages: 1 -->\n<svg width=\"358pt\" height=\"1044pt\"\n viewBox=\"0.00 0.00 358.00 1044.00\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n<g id=\"graph0\" class=\"graph\" transform=\"scale(1 1) rotate(0) translate(4 1039.75)\">\n<title>CFG</title>\n<polygon fill=\"white\" stroke=\"none\" points=\"-4,4 -4,-1039.75 353.88,-1039.75 353.88,4 -4,4\"/>\n<!-- B1 -->\n<g id=\"node1\" class=\"node\">\n<title>B1</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"184.75,-1035.75 111,-1035.75 111,-958.75 184.75,-958.75 184.75,-1035.75\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"119\" y=\"-1018.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">B1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"119\" y=\"-1001.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">sum = 0</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"119\" y=\"-983.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">max = 0</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"119\" y=\"-966.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">i = 0</text>\n</g>\n<!-- B2 -->\n<g id=\"node2\" class=\"node\">\n<title>B2</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"226,-921.75 69.75,-921.75 69.75,-879.25 226,-879.25 226,-921.75\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"77.75\" y=\"-904.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">B2 (L1)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"77.75\" y=\"-887.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">if i &gt;= n goto L2</text>\n</g>\n<!-- B1&#45;&gt;B2 -->\n<g id=\"edge1\" class=\"edge\">\n<title>B1&#45;&gt;B2</title>\n<path fill=\"none\" stroke=\"black\" d=\"M147.88,-958.26C147.88,-950.05 147.88,-941.46 147.88,-933.51\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"151.38,-933.59 147.88,-923.59 144.38,-933.59 151.38,-933.59\"/>\n</g>\n<!-- B3 -->\n<g id=\"node3\" class=\"node\">\n<title>B3</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"176.5,-817.38 119.25,-817.38 119.25,-774.88 176.5,-774.88 176.5,-817.38\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"127.25\" y=\"-800.08\" font-family=\"Courier,monospace\" font-size=\"14.00\">B3</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"127.25\" y=\"-782.83\" font-family=\"Courier,monospace\" font-size=\"14.00\">j = 0</text>\n</g>\n<!-- B2&#45;&gt;B3 -->\n<g id=\"edge2\" class=\"edge\">\n<title>B2&#45;&gt;B3</title>\n<path fill=\"none\" stroke=\"black\" d=\"M147.88,-878.78C147.88,-864.49 147.88,-845.21 147.88,-828.98\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"151.38,-829.32 147.88,-819.32 144.38,-829.32 151.38,-829.32\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"168.5\" y=\"-847.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">i &lt; n</text>\n</g>\n<!-- B12 -->\n<g id=\"node12\" class=\"node\">\n<title>B12</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"334.75,-826 195,-826 195,-766.25 334.75,-766.25 334.75,-826\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"203\" y=\"-808.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">B12 (L2)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"203\" y=\"-791.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t16 = sum + max</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"203\" y=\"-774.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">return t16</text>\n</g>\n<!-- B2&#45;&gt;B12 -->\n<g id=\"edge3\" class=\"edge\">\n<title>B2&#45;&gt;B12</title>\n<path fill=\"none\" stroke=\"black\" d=\"M172.25,-878.96C178.96,-873.25 186.22,-867.04 192.88,-861.25 203.04,-852.41 213.92,-842.79 224.08,-833.76\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"226.14,-836.61 231.27,-827.34 221.48,-831.38 226.14,-836.61\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"235.52\" y=\"-847.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">i &gt;= n</text>\n</g>\n<!-- B4 -->\n<g id=\"node4\" class=\"node\">\n<title>B4</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"273,-729.25 116.75,-729.25 116.75,-686.75 273,-686.75 273,-729.25\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"124.75\" y=\"-711.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">B4 (L3)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"124.75\" y=\"-694.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">if j &gt;= i goto L4</text>\n</g>\n<!-- B3&#45;&gt;B4 -->\n<g id=\"edge4\" class=\"edge\">\n<title>B3&#45;&gt;B4</title>\n<path fill=\"none\" stroke=\"black\" d=\"M159.01,-774.71C164.77,-764.17 171.9,-751.1 178.29,-739.4\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"181.21,-741.35 182.93,-730.89 175.07,-737.99 181.21,-741.35\"/>\n</g>\n<!-- B5 -->\n<g id=\"node5\" class=\"node\">\n<title>B5</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"322.12,-633.5 157.62,-633.5 157.62,-591 322.12,-591 322.12,-633.5\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-616.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">B5</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-598.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">if j &gt;= 10 goto L4</text>\n</g>\n<!-- B4&#45;&gt;B5 -->\n<g id=\"edge5\" class=\"edge\">\n<title>B4&#45;&gt;B5</title>\n<path fill=\"none\" stroke=\"black\" d=\"M204.64,-686.66C210.61,-674.21 218.37,-658.05 225.09,-644.05\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"228.15,-645.77 229.32,-635.24 221.84,-642.74 228.15,-645.77\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"242.03\" y=\"-655.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">j &lt; i</text>\n</g>\n<!-- B11 -->\n<g id=\"node11\" class=\"node\">\n<title>B11</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"139.75,-537.75 0,-537.75 0,-357.25 139.75,-357.25 139.75,-537.75\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-520.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">B11 (L4)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-503.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t10 = i * 8</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-485.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">t11 = sum + t10</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-468.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t12 = i + 1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-451.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t13 = t12 * 8</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-434.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t14 = t11 + t13</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-416.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">sum = t14</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-399.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t15 = i + 1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-382.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">i = t15</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"8\" y=\"-365.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">goto L1</text>\n</g>\n<!-- B4&#45;&gt;B11 -->\n<g id=\"edge6\" class=\"edge\">\n<title>B4&#45;&gt;B11</title>\n<path fill=\"none\" stroke=\"black\" d=\"M155.46,-686.31C135.46,-673.74 112.63,-655.8 99.38,-633.5 84.41,-608.33 76.32,-577.97 72.12,-549.2\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"75.6,-548.81 70.84,-539.34 68.66,-549.71 75.6,-548.81\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"124.12\" y=\"-607.58\" font-family=\"Courier,monospace\" font-size=\"14.00\">j &gt;= i</text>\n</g>\n<!-- B6 -->\n<g id=\"node6\" class=\"node\">\n<title>B6</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"322.12,-520.5 157.62,-520.5 157.62,-374.5 322.12,-374.5 322.12,-520.5\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-503.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">B6</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-485.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">t1 = arr[j]</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-468.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t2 = t1 * 4</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-451.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t3 = arr[i]</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-434.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t4 = t3 * 4</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-416.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">t5 = t2 + t4</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-399.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t = t5</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"165.62\" y=\"-382.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">if t &gt; max goto L7</text>\n</g>\n<!-- B5&#45;&gt;B6 -->\n<g id=\"edge7\" class=\"edge\">\n<title>B5&#45;&gt;B6</title>\n<path fill=\"none\" stroke=\"black\" d=\"M239.88,-590.64C239.88,-575.56 239.88,-554.02 239.88,-532.25\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"243.38,-532.39 239.88,-522.39 236.38,-532.39 243.38,-532.39\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"264.62\" y=\"-559.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">j &lt; 10</text>\n</g>\n<!-- B5&#45;&gt;B11 -->\n<g id=\"edge8\" class=\"edge\">\n<title>B5&#45;&gt;B11</title>\n<path fill=\"none\" stroke=\"black\" d=\"M202.37,-590.53C194.05,-585.26 185.52,-579.29 178.12,-573 167.8,-564.21 157.58,-554.42 147.8,-544.29\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"150.51,-542.06 141.09,-537.21 145.43,-546.87 150.51,-542.06\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"207\" y=\"-559.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">j &gt;= 10</text>\n</g>\n<!-- B7 -->\n<g id=\"node7\" class=\"node\">\n<title>B7</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"228,-304 71.75,-304 71.75,-261.5 228,-261.5 228,-304\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"79.75\" y=\"-286.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">B7</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"79.75\" y=\"-269.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">if t != 0 goto L5</text>\n</g>\n<!-- B6&#45;&gt;B7 -->\n<g id=\"edge9\" class=\"edge\">\n<title>B6&#45;&gt;B7</title>\n<path fill=\"none\" stroke=\"black\" d=\"M199.88,-374.17C188.21,-353.08 176.1,-331.16 166.71,-314.19\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"169.88,-312.7 161.98,-305.64 163.76,-316.09 169.88,-312.7\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"211.99\" y=\"-325.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">t &lt;= max</text>\n</g>\n<!-- B8 -->\n<g id=\"node8\" class=\"node\">\n<title>B8</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"290.75,-191 217,-191 217,-131.25 290.75,-131.25 290.75,-191\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"225\" y=\"-173.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">B8 (L7)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"225\" y=\"-156.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">max = t</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"225\" y=\"-139.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">goto L6</text>\n</g>\n<!-- B6&#45;&gt;B8 -->\n<g id=\"edge10\" class=\"edge\">\n<title>B6&#45;&gt;B8</title>\n<path fill=\"none\" stroke=\"black\" d=\"M246.5,-374.14C247.41,-362.48 248.24,-350.54 248.88,-339.25 251.5,-292.48 252.77,-238.67 253.37,-202.75\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"256.87,-202.86 253.52,-192.81 249.87,-202.75 256.87,-202.86\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"280.85\" y=\"-278.07\" font-family=\"Courier,monospace\" font-size=\"14.00\">t &gt; max</text>\n</g>\n<!-- B7&#45;&gt;B8 -->\n<g id=\"edge11\" class=\"edge\">\n<title>B7&#45;&gt;B8</title>\n<path fill=\"none\" stroke=\"black\" d=\"M167.75,-261.19C182.39,-244.35 203.48,-220.09 221.13,-199.79\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"223.54,-202.35 227.46,-192.51 218.25,-197.76 223.54,-202.35\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"220.4\" y=\"-230.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t == 0</text>\n</g>\n<!-- B9 -->\n<g id=\"node9\" class=\"node\">\n<title>B9</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"193.5,-208.25 70.25,-208.25 70.25,-114 193.5,-114 193.5,-208.25\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"78.25\" y=\"-190.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">B9 (L5)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"78.25\" y=\"-173.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">t6 = t &#45; max</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"78.25\" y=\"-156.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t7 = t6 * 2</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"78.25\" y=\"-139.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t8 = sum + t7</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"78.25\" y=\"-121.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">sum = t8</text>\n</g>\n<!-- B7&#45;&gt;B9 -->\n<g id=\"edge12\" class=\"edge\">\n<title>B7&#45;&gt;B9</title>\n<path fill=\"none\" stroke=\"black\" d=\"M135.12,-261.21C131.94,-255.71 129.03,-249.6 127.38,-243.5 125.35,-236.07 124.39,-228.12 124.14,-220.21\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"127.64,-220.25 124.21,-210.23 120.64,-220.2 127.64,-220.25\"/>\n<text xml:space=\"preserve\" text-anchor=\"middle\" x=\"152.12\" y=\"-230.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">t != 0</text>\n</g>\n<!-- B10 -->\n<g id=\"node10\" class=\"node\">\n<title>B10</title>\n<polygon fill=\"none\" stroke=\"black\" points=\"303.12,-77 204.62,-77 204.62,0 303.12,0 303.12,-77\"/>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"212.62\" y=\"-59.7\" font-family=\"Courier,monospace\" font-size=\"14.00\">B10 (L6)</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"212.62\" y=\"-42.45\" font-family=\"Courier,monospace\" font-size=\"14.00\">t9 = j + 1</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"212.62\" y=\"-25.2\" font-family=\"Courier,monospace\" font-size=\"14.00\">j = t9</text>\n<text xml:space=\"preserve\" text-anchor=\"start\" x=\"212.62\" y=\"-7.95\" font-family=\"Courier,monospace\" font-size=\"14.00\">goto L3</text>\n</g>\n<!-- B8&#45;&gt;B10 -->\n<g id=\"edge13\" class=\"edge\">\n<title>B8&#45;&gt;B10</title>\n<path fill=\"none\" stroke=\"black\" d=\"M253.88,-130.93C253.88,-118.16 253.88,-102.84 253.88,-88.41\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"257.38,-88.62 253.88,-78.62 250.38,-88.62 257.38,-88.62\"/>\n</g>\n<!-- B9&#45;&gt;B10 -->\n<g id=\"edge14\" class=\"edge\">\n<title>B9&#45;&gt;B10</title>\n<path fill=\"none\" stroke=\"black\" d=\"M178.69,-113.83C188.15,-104.48 198.09,-94.65 207.54,-85.32\"/>\n<polygon fill=\"black\" stroke=\"black\" points=\"209.95,-87.85 214.61,-78.33 205.03,-82.87 209.95,-87.85\"/>\n</g>\n<!-- B10&#45;&gt;B4 -->\n<g id=\"edge15\" class=\"edge\">\n<title>B10&#45;&gt;B4</title>\n<path fill=\"none\" stroke=\"red\" d=\"M303.56,-75.65C326.99,-97.13 349.88,-126.67 349.88,-160.12 349.88,-613.25 349.88,-613.25 349.88,-613.25 349.88,-649.45 318.55,-672.04 284.06,-685.96\"/>\n<polygon fill=\"red\" stroke=\"red\" points=\"282.83,-682.68 274.7,-689.47 285.29,-689.23 282.83,-682.68\"/>\n</g>\n<!-- B11&#45;&gt;B2 -->\n<g id=\"edge16\" class=\"edge\">\n<title>B11&#45;&gt;B2</title>\n<path fill=\"none\" stroke=\"red\" d=\"M50.37,-538.06C46.64,-561.74 43.88,-587.36 43.88,-611.25 43.88,-797.12 43.88,-797.12 43.88,-797.12 43.88,-829.62 69.98,-855.25 96.03,-872.74\"/>\n<polygon fill=\"red\" stroke=\"red\" points=\"93.98,-875.58 104.3,-878 97.74,-869.68 93.98,-875.58\"/>\n</g>\n</g>\n</svg>\n",
      "svg_url": "assets/cfg/b4.svg",
      "png_url": "assets/cfg/b4.png"
    },
    "opt": {
      "raw": "No. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 35\n1   | Constant folding and propagation | 0       | 35\n2   | Strength reduction               | 5       | 35\n3   | CSE by local value numbering     | 1       | 35\n4   | Copy propagation                 | 2       | 35\n5   | Dead-code elimination            | 1       | 34\n6   | Temporary coalescing             | 6       | 31\n\noptimized code:\nB1:\n    sum = 0\n    max = 0\n    i = 0\nB2: (labels L1)\n    if i >= n goto L2\nB3:\n    j = 0\nB4: (labels L3)\n    if j >= i goto L4\nB5:\n    if j >= 10 goto L4\nB6:\n    t1 = arr[j]\n    t2 = t1 << 2\n    t3 = arr[i]\n    t4 = t3 << 2\n    t5 = t2 + t4\n    t = t5\n    if t5 > max goto L7\nB7:\n    if t != 0 goto L5\nB8: (labels L7)\n    max = t\n    goto L6\nB9: (labels L5)\n    t6 = t - max\n    t7 = t6 << 1\n    sum = sum + t7\nB10: (labels L6)\n    j = j + 1\n    goto L3\nB11: (labels L4)\n    t10 = i << 3\n    t11 = sum + t10\n    t12 = i + 1\n    t13 = t12 << 3\n    sum = t11 + t13\n    i = t12\n    goto L1\nB12: (labels L2)\n    t16 = sum + max\n    return t16\ninstructions: 35 -> 31   temporaries remaining: 12   liveness iterations: 4\n",
      "parsed": {
        "pass_table": [
          {
            "pass_num": 0,
            "name": "Unoptimized",
            "changes": 0,
            "instrs_after": 35
          },
          {
            "pass_num": 1,
            "name": "Constant folding and propagation",
            "changes": 0,
            "instrs_after": 35
          },
          {
            "pass_num": 2,
            "name": "Strength reduction",
            "changes": 5,
            "instrs_after": 35
          },
          {
            "pass_num": 3,
            "name": "CSE by local value numbering",
            "changes": 1,
            "instrs_after": 35
          },
          {
            "pass_num": 4,
            "name": "Copy propagation",
            "changes": 2,
            "instrs_after": 35
          },
          {
            "pass_num": 5,
            "name": "Dead-code elimination",
            "changes": 1,
            "instrs_after": 34
          },
          {
            "pass_num": 6,
            "name": "Temporary coalescing",
            "changes": 6,
            "instrs_after": 31
          }
        ],
        "optimized_code": "B1:\n    sum = 0\n    max = 0\n    i = 0\nB2: (labels L1)\n    if i >= n goto L2\nB3:\n    j = 0\nB4: (labels L3)\n    if j >= i goto L4\nB5:\n    if j >= 10 goto L4\nB6:\n    t1 = arr[j]\n    t2 = t1 << 2\n    t3 = arr[i]\n    t4 = t3 << 2\n    t5 = t2 + t4\n    t = t5\n    if t5 > max goto L7\nB7:\n    if t != 0 goto L5\nB8: (labels L7)\n    max = t\n    goto L6\nB9: (labels L5)\n    t6 = t - max\n    t7 = t6 << 1\n    sum = sum + t7\nB10: (labels L6)\n    j = j + 1\n    goto L3\nB11: (labels L4)\n    t10 = i << 3\n    t11 = sum + t10\n    t12 = i + 1\n    t13 = t12 << 3\n    sum = t11 + t13\n    i = t12\n    goto L1\nB12: (labels L2)\n    t16 = sum + max\n    return t16",
        "summary": "instructions: 35 -> 31   temporaries remaining: 12   liveness iterations: 4"
      }
    },
    "ssa": {
      "raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\nB2    | B1   | {B2}   | sum,max,i\nB3    | B2   | {B2}   | -\nB4    | B3   | {B2,B4}| sum,max,j\nB5    | B4   | {B4,B11}| -\nB6    | B5   | {B4}   | -\nB7    | B6   | {B8,B10}| -\nB8    | B6   | {B10}  | -\nB9    | B7   | {B10}  | -\nB10   | B6   | {B4}   | sum,max\nB11   | B4   | {B2}   | -\nB12   | B2   | {}     | -\n\nB1:\n    sum1 = 0\n    max1 = 0\n    i1 = 0\nB2: (labels L1)\n    sum2 = phi(sum1, sum6)\n    max2 = phi(max1, max3)\n    i2 = phi(i1, i3)\n    if i2 >= n goto L2\nB3:\n    j1 = 0\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j2 = phi(j1, j3)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 * 4\n    t3 = arr[i2]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t_1 = t5\n    if t_1 > max3 goto L7\nB7:\n    if t_1 != 0 goto L5\nB8: (labels L7)\n    max4 = t_1\n    goto L6\nB9: (labels L5)\n    t6 = t_1 - max3\n    t7 = t6 * 2\n    t8 = sum3 + t7\n    sum4 = t8\nB10: (labels L6)\n    sum5 = phi(sum3, sum4)\n    max5 = phi(max4, max3)\n    t9 = j2 + 1\n    j3 = t9\n    goto L3\nB11: (labels L4)\n    t10 = i2 * 8\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum6 = t14\n    t15 = i2 + 1\n    i3 = t15\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16\nphis_unpruned=11 phis_pruned=8\nverify: OK\n",
      "parsed": {
        "dom_table": [
          {
            "block": "B1",
            "idom": "-",
            "df": "{}",
            "phis": ""
          },
          {
            "block": "B2",
            "idom": "B1",
            "df": "{B2}",
            "phis": "sum,max,i"
          },
          {
            "block": "B3",
            "idom": "B2",
            "df": "{B2}",
            "phis": ""
          },
          {
            "block": "B4",
            "idom": "B3",
            "df": "{B2,B4}",
            "phis": "sum,max,j"
          },
          {
            "block": "B5",
            "idom": "B4",
            "df": "{B4,B11}",
            "phis": ""
          },
          {
            "block": "B6",
            "idom": "B5",
            "df": "{B4}",
            "phis": ""
          },
          {
            "block": "B7",
            "idom": "B6",
            "df": "{B8,B10}",
            "phis": ""
          },
          {
            "block": "B8",
            "idom": "B6",
            "df": "{B10}",
            "phis": ""
          },
          {
            "block": "B9",
            "idom": "B7",
            "df": "{B10}",
            "phis": ""
          },
          {
            "block": "B10",
            "idom": "B6",
            "df": "{B4}",
            "phis": "sum,max"
          },
          {
            "block": "B11",
            "idom": "B4",
            "df": "{B2}",
            "phis": ""
          },
          {
            "block": "B12",
            "idom": "B2",
            "df": "{}",
            "phis": ""
          }
        ],
        "ssa_code": "B1:\n    sum1 = 0\n    max1 = 0\n    i1 = 0\nB2: (labels L1)\n    sum2 = phi(sum1, sum6)\n    max2 = phi(max1, max3)\n    i2 = phi(i1, i3)\n    if i2 >= n goto L2\nB3:\n    j1 = 0\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j2 = phi(j1, j3)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 * 4\n    t3 = arr[i2]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t_1 = t5\n    if t_1 > max3 goto L7\nB7:\n    if t_1 != 0 goto L5\nB8: (labels L7)\n    max4 = t_1\n    goto L6\nB9: (labels L5)\n    t6 = t_1 - max3\n    t7 = t6 * 2\n    t8 = sum3 + t7\n    sum4 = t8\nB10: (labels L6)\n    sum5 = phi(sum3, sum4)\n    max5 = phi(max4, max3)\n    t9 = j2 + 1\n    j3 = t9\n    goto L3\nB11: (labels L4)\n    t10 = i2 * 8\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum6 = t14\n    t15 = i2 + 1\n    i3 = t15\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16",
        "summary": "phis_unpruned=11 phis_pruned=8",
        "verify": "verify: OK"
      },
      "unpruned_raw": "Block | idom | DF     | phi placed for\nB1    | -    | {}     | -\nB2    | B1   | {B2}   | sum,max,i,j,t\nB3    | B2   | {B2}   | -\nB4    | B3   | {B2,B4}| sum,max,j,t\nB5    | B4   | {B4,B11}| -\nB6    | B5   | {B4}   | -\nB7    | B6   | {B8,B10}| -\nB8    | B6   | {B10}  | -\nB9    | B7   | {B10}  | -\nB10   | B6   | {B4}   | sum,max\nB11   | B4   | {B2}   | -\nB12   | B2   | {}     | -\n\nB1:\n    sum1 = 0\n    max1 = 0\n    i1 = 0\nB2: (labels L1)\n    sum2 = phi(sum1, sum6)\n    max2 = phi(max1, max3)\n    i2 = phi(i1, i3)\n    j1 = phi(j, j3)\n    t_1 = phi(t, t_2)\n    if i2 >= n goto L2\nB3:\n    j2 = 0\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j3 = phi(j2, j4)\n    t_2 = phi(t_1, t_3)\n    if j3 >= i2 goto L4\nB5:\n    if j3 >= 10 goto L4\nB6:\n    t1 = arr[j3]\n    t2 = t1 * 4\n    t3 = arr[i2]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t_3 = t5\n    if t_3 > max3 goto L7\nB7:\n    if t_3 != 0 goto L5\nB8: (labels L7)\n    max4 = t_3\n    goto L6\nB9: (labels L5)\n    t6 = t_3 - max3\n    t7 = t6 * 2\n    t8 = sum3 + t7\n    sum4 = t8\nB10: (labels L6)\n    sum5 = phi(sum3, sum4)\n    max5 = phi(max4, max3)\n    t9 = j3 + 1\n    j4 = t9\n    goto L3\nB11: (labels L4)\n    t10 = i2 * 8\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum6 = t14\n    t15 = i2 + 1\n    i3 = t15\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16\nphis_unpruned=11 phis_pruned=8\nverify: OK\n"
    },
    "ssa_opt": {
      "raw": "B1: (empty)\nB2: (labels L1)\n    sum2 = phi(0, t14)\n    max2 = phi(0, max3)\n    i2 = phi(0, t15)\n    if i2 >= n goto L2\nB3: (empty)\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j2 = phi(0, t9)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 << 2\n    t3 = arr[i2]\n    t4 = t3 << 2\n    t5 = t2 + t4\n    if t5 > max3 goto L7\nB7:\n    if t5 != 0 goto L5\nB8: (labels L7)\n    goto L6\nB9: (labels L5)\n    t6 = t5 - max3\n    t7 = t6 << 1\n    t8 = sum3 + t7\nB10: (labels L6)\n    sum5 = phi(sum3, t8)\n    max5 = phi(t5, max3)\n    t9 = j2 + 1\n    goto L3\nB11: (labels L4)\n    t10 = i2 << 3\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 << 3\n    t14 = t11 + t13\n    t15 = i2 + 1\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16\nssa instrs: 43 -> 33   rounds: 1   copies propagated: 6   phis removed: 0   dataflow iterations: 0\nverify: OK\n",
      "parsed": {
        "code": "B1: (empty)\nB2: (labels L1)\n    sum2 = phi(0, t14)\n    max2 = phi(0, max3)\n    i2 = phi(0, t15)\n    if i2 >= n goto L2\nB3: (empty)\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j2 = phi(0, t9)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 << 2\n    t3 = arr[i2]\n    t4 = t3 << 2\n    t5 = t2 + t4\n    if t5 > max3 goto L7\nB7:\n    if t5 != 0 goto L5\nB8: (labels L7)\n    goto L6\nB9: (labels L5)\n    t6 = t5 - max3\n    t7 = t6 << 1\n    t8 = sum3 + t7\nB10: (labels L6)\n    sum5 = phi(sum3, t8)\n    max5 = phi(t5, max3)\n    t9 = j2 + 1\n    goto L3\nB11: (labels L4)\n    t10 = i2 << 3\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 << 3\n    t14 = t11 + t13\n    t15 = i2 + 1\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16",
        "summary": "ssa instrs: 43 -> 33   rounds: 1   copies propagated: 6   phis removed: 0   dataflow iterations: 0",
        "verify": "verify: OK"
      }
    },
    "braun": {
      "raw": "B1:\n    sum1 = 0\n    max1 = 0\n    i1 = 0\nB2: (labels L1)\n    i2 = phi(i1, i5)\n    sum2 = phi(sum1, sum5)\n    max2 = phi(max1, max4)\n    if i2 >= n goto L2\nB3:\n    j1 = 0\nB4: (labels L3)\n    j2 = phi(j1, j5)\n    sum4 = phi(sum2, sum7)\n    max4 = phi(max2, max6)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 * 4\n    t3 = arr[i2]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t_1 = t5\n    if t_1 > max4 goto L7\nB7:\n    if t_1 != 0 goto L5\nB8: (labels L7)\n    max5 = t_1\n    goto L6\nB9: (labels L5)\n    t6 = t_1 - max4\n    t7 = t6 * 2\n    t8 = sum4 + t7\n    sum6 = t8\nB10: (labels L6)\n    max6 = phi(max5, max4)\n    sum7 = phi(sum4, sum6)\n    t9 = j2 + 1\n    j5 = t9\n    goto L3\nB11: (labels L4)\n    t10 = i2 * 8\n    t11 = sum4 + t10\n    t12 = i2 + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum5 = t14\n    t15 = i2 + 1\n    i5 = t15\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16\nphis_braun=8\nverify: OK\n"
    },
    "compare": {
      "raw": "phis_cytron_pruned=8 phis_braun=8 MATCH\nverify: OK\n"
    },
    "metrics": {
      "raw": "metric                        | value\n------------------------------+--------------------------------------\ntac_instrs                    | 35\ntemps_created                 | 16\nlabels                        | 7\nblocks                        | 12\nedges                         | 16\nback_edges                    | 2\nquad_entries                  | 35\nquad_bytes                    | 455\ntriple_entries                | 40\ntriple_bytes                  | 360\nindirect_entries              | 40\nindirect_bytes                | 520\ndel_shift_total_quad          | 0\ndel_shift_total_triple        | 780\ndel_shift_total_indirect      | 0\ndel_rewrite_total_quad        | 0\ndel_rewrite_total_triple      | 434\ndel_rewrite_total_indirect    | 0\nopt_instrs_after              | 31\nopt_temps_remaining           | 12\nliveness_iterations           | 4\nphis_unpruned                 | 11\nphis_pruned                   | 8\nphis_braun                    | 8\nssa_instrs_before_opt         | 43\nssa_instrs_after_opt          | 33\nssa_opt_rounds                | 1\ntime_frontend_us_min          | 174.32 (indicative only)\ntime_frontend_us_mean         | 199.91 (indicative only)\ntime_cfg_us_min               | 91.13 (indicative only)\ntime_cfg_us_mean              | 102.87 (indicative only)\ntime_opt_us_min               | 727.87 (indicative only)\ntime_opt_us_mean              | 825.78 (indicative only)\ntime_ssa_us_min               | 502.59 (indicative only)\ntime_ssa_us_mean              | 564.12 (indicative only)\ntime_ssaopt_us_min            | 219.30 (indicative only)\ntime_ssaopt_us_mean           | 251.86 (indicative only)\n",
      "parsed": {
        "tac_instrs": "35",
        "temps_created": "16",
        "labels": "7",
        "blocks": "12",
        "edges": "16",
        "back_edges": "2",
        "quad_entries": "35",
        "quad_bytes": "455",
        "triple_entries": "40",
        "triple_bytes": "360",
        "indirect_entries": "40",
        "indirect_bytes": "520",
        "del_shift_total_quad": "0",
        "del_shift_total_triple": "780",
        "del_shift_total_indirect": "0",
        "del_rewrite_total_quad": "0",
        "del_rewrite_total_triple": "434",
        "del_rewrite_total_indirect": "0",
        "opt_instrs_after": "31",
        "opt_temps_remaining": "12",
        "liveness_iterations": "4",
        "phis_unpruned": "11",
        "phis_pruned": "8",
        "phis_braun": "8",
        "ssa_instrs_before_opt": "43",
        "ssa_instrs_after_opt": "33",
        "ssa_opt_rounds": "1",
        "time_frontend_us_min": "174.32",
        "time_frontend_us_mean": "199.91",
        "time_cfg_us_min": "91.13",
        "time_cfg_us_mean": "102.87",
        "time_opt_us_min": "727.87",
        "time_opt_us_mean": "825.78",
        "time_ssa_us_min": "502.59",
        "time_ssa_us_mean": "564.12",
        "time_ssaopt_us_min": "219.30",
        "time_ssaopt_us_mean": "251.86"
      }
    },
    "all": {
      "raw": "=== TAC ===\n1: sum = 0\n2: max = 0\n3: i = 0\n4: L1: if i >= n goto L2\n5: j = 0\n6: L3: if j >= i goto L4\n7: if j >= 10 goto L4\n8: t1 = arr[j]\n9: t2 = t1 * 4\n10: t3 = arr[i]\n11: t4 = t3 * 4\n12: t5 = t2 + t4\n13: t = t5\n14: if t > max goto L7\n15: if t != 0 goto L5\n16: L7: max = t\n17: goto L6\n18: L5: t6 = t - max\n19: t7 = t6 * 2\n20: t8 = sum + t7\n21: sum = t8\n22: L6: t9 = j + 1\n23: j = t9\n24: goto L3\n25: L4: t10 = i * 8\n26: t11 = sum + t10\n27: t12 = i + 1\n28: t13 = t12 * 8\n29: t14 = t11 + t13\n30: sum = t14\n31: t15 = i + 1\n32: i = t15\n33: goto L1\n34: L2: t16 = sum + max\n35: return t16\ninstructions=35 temporaries=16 labels=7\n\n=== FORMATS ===\nQUADRUPLES\nindex  op      arg1    arg2    result  label\n(0)    =       0               sum     \n(1)    =       0               max     \n(2)    =       0               i       \n(3)    if>=    i       n       L2      L1\n(4)    =       0               j       \n(5)    if>=    j       i       L4      L3\n(6)    if>=    j       10      L4      \n(7)    =[]     arr     j       t1      \n(8)    *       t1      4       t2      \n(9)    =[]     arr     i       t3      \n(10)   *       t3      4       t4      \n(11)   +       t2      t4      t5      \n(12)   =       t5              t       \n(13)   if>     t       max     L7      \n(14)   if!=    t       0       L5      \n(15)   =       t               max     L7\n(16)   goto                    L6      \n(17)   -       t       max     t6      L5\n(18)   *       t6      2       t7      \n(19)   +       sum     t7      t8      \n(20)   =       t8              sum     \n(21)   +       j       1       t9      L6\n(22)   =       t9              j       \n(23)   goto                    L3      \n(24)   *       i       8       t10     L4\n(25)   +       sum     t10     t11     \n(26)   +       i       1       t12     \n(27)   *       t12     8       t13     \n(28)   +       t11     t13     t14     \n(29)   =       t14             sum     \n(30)   +       i       1       t15     \n(31)   =       t15             i       \n(32)   goto                    L1      \n(33)   +       sum     max     t16     L2\n(34)   return  t16                     \n\nTRIPLES\nindex  op      arg1    arg2    label\n(0)    =       sum     0       \n(1)    =       max     0       \n(2)    =       i       0       \n(3)    >=      i       n       L1\n(4)    if      (3)     L2      \n(5)    =       j       0       \n(6)    >=      j       i       L3\n(7)    if      (6)     L4      \n(8)    >=      j       10      \n(9)    if      (8)     L4      \n(10)   =[]     arr     j       \n(11)   *       (10)    4       \n(12)   =[]     arr     i       \n(13)   *       (12)    4       \n(14)   +       (11)    (13)    \n(15)   =       t       (14)    \n(16)   >       t       max     \n(17)   if      (16)    L7      \n(18)   !=      t       0       \n(19)   if      (18)    L5      \n(20)   =       max     t       L7\n(21)   goto            L6      \n(22)   -       t       max     L5\n(23)   *       (22)    2       \n(24)   +       sum     (23)    \n(25)   =       sum     (24)    \n(26)   +       j       1       L6\n(27)   =       j       (26)    \n(28)   goto            L3      \n(29)   *       i       8       L4\n(30)   +       sum     (29)    \n(31)   +       i       1       \n(32)   *       (31)    8       \n(33)   +       (30)    (32)    \n(34)   =       sum     (33)    \n(35)   +       i       1       \n(36)   =       i       (35)    \n(37)   goto            L1      \n(38)   +       sum     max     L2\n(39)   return  (38)            \n\nINDIRECT TRIPLES\npointer  target\n35       (0)\n36       (1)\n37       (2)\n38       (3)\n39       (4)\n40       (5)\n41       (6)\n42       (7)\n43       (8)\n44       (9)\n45       (10)\n46       (11)\n47       (12)\n48       (13)\n49       (14)\n50       (15)\n51       (16)\n52       (17)\n53       (18)\n54       (19)\n55       (20)\n56       (21)\n57       (22)\n58       (23)\n59       (24)\n60       (25)\n61       (26)\n62       (27)\n63       (28)\n64       (29)\n65       (30)\n66       (31)\n67       (32)\n68       (33)\n69       (34)\n70       (35)\n71       (36)\n72       (37)\n73       (38)\n74       (39)\n\nformat           | entries | bytes\nquadruples       | 35      | 455\ntriples          | 40      | 360\nindirect triples | 40      | 520\n\n=== BLOCKS & CFG ===\nB1 [1-3] labels=- pred=- succ=B2\n    sum = 0\n    max = 0\n    i = 0\nB2 [4-4] labels=L1 pred=B1,B11 succ=B3(i < n),B12(i >= n)\n    if i >= n goto L2\nB3 [5-5] labels=- pred=B2 succ=B4\n    j = 0\nB4 [6-6] labels=L3 pred=B3,B10 succ=B5(j < i),B11(j >= i)\n    if j >= i goto L4\nB5 [7-7] labels=- pred=B4 succ=B6(j < 10),B11(j >= 10)\n    if j >= 10 goto L4\nB6 [8-14] labels=- pred=B5 succ=B7(t <= max),B8(t > max)\n    t1 = arr[j]\n    t2 = t1 * 4\n    t3 = arr[i]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t = t5\n    if t > max goto L7\nB7 [15-15] labels=- pred=B6 succ=B8(t == 0),B9(t != 0)\n    if t != 0 goto L5\nB8 [16-17] labels=L7 pred=B6,B7 succ=B10\n    max = t\n    goto L6\nB9 [18-21] labels=L5 pred=B7 succ=B10\n    t6 = t - max\n    t7 = t6 * 2\n    t8 = sum + t7\n    sum = t8\nB10 [22-24] labels=L6 pred=B8,B9 succ=B4\n    t9 = j + 1\n    j = t9\n    goto L3\nB11 [25-33] labels=L4 pred=B4,B5 succ=B2\n    t10 = i * 8\n    t11 = sum + t10\n    t12 = i + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum = t14\n    t15 = i + 1\n    i = t15\n    goto L1\nB12 [34-35] labels=L2 pred=B2 succ=-\n    t16 = sum + max\n    return t16\nback edges: B10->B4, B11->B2\nblocks=12 edges=16 back_edges=2\n\n=== OPTIMIZATION ===\nNo. | Pass                             | Changes | Instrs after\n0   | Unoptimized                      | 0       | 35\n1   | Constant folding and propagation | 0       | 35\n2   | Strength reduction               | 5       | 35\n3   | CSE by local value numbering     | 1       | 35\n4   | Copy propagation                 | 2       | 35\n5   | Dead-code elimination            | 1       | 34\n6   | Temporary coalescing             | 6       | 31\n\noptimized code:\nB1:\n    sum = 0\n    max = 0\n    i = 0\nB2: (labels L1)\n    if i >= n goto L2\nB3:\n    j = 0\nB4: (labels L3)\n    if j >= i goto L4\nB5:\n    if j >= 10 goto L4\nB6:\n    t1 = arr[j]\n    t2 = t1 << 2\n    t3 = arr[i]\n    t4 = t3 << 2\n    t5 = t2 + t4\n    t = t5\n    if t5 > max goto L7\nB7:\n    if t != 0 goto L5\nB8: (labels L7)\n    max = t\n    goto L6\nB9: (labels L5)\n    t6 = t - max\n    t7 = t6 << 1\n    sum = sum + t7\nB10: (labels L6)\n    j = j + 1\n    goto L3\nB11: (labels L4)\n    t10 = i << 3\n    t11 = sum + t10\n    t12 = i + 1\n    t13 = t12 << 3\n    sum = t11 + t13\n    i = t12\n    goto L1\nB12: (labels L2)\n    t16 = sum + max\n    return t16\ninstructions: 35 -> 31   temporaries remaining: 12   liveness iterations: 4\n\n=== SSA ===\nBlock | idom | DF     | phi placed for\nB1    | -    | {}     | -\nB2    | B1   | {B2}   | sum,max,i\nB3    | B2   | {B2}   | -\nB4    | B3   | {B2,B4}| sum,max,j\nB5    | B4   | {B4,B11}| -\nB6    | B5   | {B4}   | -\nB7    | B6   | {B8,B10}| -\nB8    | B6   | {B10}  | -\nB9    | B7   | {B10}  | -\nB10   | B6   | {B4}   | sum,max\nB11   | B4   | {B2}   | -\nB12   | B2   | {}     | -\n\nB1:\n    sum1 = 0\n    max1 = 0\n    i1 = 0\nB2: (labels L1)\n    sum2 = phi(sum1, sum6)\n    max2 = phi(max1, max3)\n    i2 = phi(i1, i3)\n    if i2 >= n goto L2\nB3:\n    j1 = 0\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j2 = phi(j1, j3)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 * 4\n    t3 = arr[i2]\n    t4 = t3 * 4\n    t5 = t2 + t4\n    t_1 = t5\n    if t_1 > max3 goto L7\nB7:\n    if t_1 != 0 goto L5\nB8: (labels L7)\n    max4 = t_1\n    goto L6\nB9: (labels L5)\n    t6 = t_1 - max3\n    t7 = t6 * 2\n    t8 = sum3 + t7\n    sum4 = t8\nB10: (labels L6)\n    sum5 = phi(sum3, sum4)\n    max5 = phi(max4, max3)\n    t9 = j2 + 1\n    j3 = t9\n    goto L3\nB11: (labels L4)\n    t10 = i2 * 8\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 * 8\n    t14 = t11 + t13\n    sum6 = t14\n    t15 = i2 + 1\n    i3 = t15\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16\nphis_unpruned=11 phis_pruned=8\nverify: OK\n\n=== SSA OPTIMIZER ===\nB1: (empty)\nB2: (labels L1)\n    sum2 = phi(0, t14)\n    max2 = phi(0, max3)\n    i2 = phi(0, t15)\n    if i2 >= n goto L2\nB3: (empty)\nB4: (labels L3)\n    sum3 = phi(sum2, sum5)\n    max3 = phi(max2, max5)\n    j2 = phi(0, t9)\n    if j2 >= i2 goto L4\nB5:\n    if j2 >= 10 goto L4\nB6:\n    t1 = arr[j2]\n    t2 = t1 << 2\n    t3 = arr[i2]\n    t4 = t3 << 2\n    t5 = t2 + t4\n    if t5 > max3 goto L7\nB7:\n    if t5 != 0 goto L5\nB8: (labels L7)\n    goto L6\nB9: (labels L5)\n    t6 = t5 - max3\n    t7 = t6 << 1\n    t8 = sum3 + t7\nB10: (labels L6)\n    sum5 = phi(sum3, t8)\n    max5 = phi(t5, max3)\n    t9 = j2 + 1\n    goto L3\nB11: (labels L4)\n    t10 = i2 << 3\n    t11 = sum3 + t10\n    t12 = i2 + 1\n    t13 = t12 << 3\n    t14 = t11 + t13\n    t15 = i2 + 1\n    goto L1\nB12: (labels L2)\n    t16 = sum2 + max2\n    return t16\nssa instrs: 43 -> 33   rounds: 1   copies propagated: 6   phis removed: 0   dataflow iterations: 0\nverify: OK\n"
    }
  }
};
