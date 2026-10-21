# tacgen: Three Address Code generator (Compiler Design case study)

## Rules for every step
- C++17, standard library only, no external dependencies. Every module is a .hpp/.cpp pair in src/.
- Keep code simple and readable; short comments explaining the compiler concept.
- After each step: build with no warnings, run the acceptance tests, report the output.
- Never change earlier modules' public interfaces without telling me.

## Mini-language
Statements: `int id;`, `id = E;`, `id[E] = E;`, `{ ... }`, `if (B) S`, `if (B) S else S`,
`while (B) S`, `return E;`. Expressions: + - * /, unary -, id, integer, id[E], id(args).
Booleans: ||, &&, !, relops (< <= > >= == !=), parentheses. `//` comments. All values are int.
Precedence (low to high): || ; && ; ! ; relational ; + - ; * / . Left associative.
Dangling else binds to nearest if. Undeclared identifiers are treated as free INPUT variables
(e.g. `n`); never an error.

## Pipeline
source -> Lexer -> Parser (recursive descent, builds AST) -> TAC generator (syntax-directed,
newtemp(), newlabel(), inherited true/false labels, short-circuit jump code) -> Quad list
-> {Quadruples, Triples, Indirect triples} views -> basic blocks + CFG -> optimizer
-> SSA (Cytron: dominators, dominance frontiers, phi placement, renaming; pruned and unpruned)
-> metrics.

## TAC instruction forms
x = y op z | x = op y | x = y | goto L | if x relop y goto L | label L: |
param x | call p, n | return y | x = y[i] | x[i] = y | x = phi(...)

## Primary IR
vector<Quad> {op, arg1, arg2, result, optional label, optional phi args with pred ids}.
Triples and indirect triples are GENERATED from the quad stream (results referenced by index).

## CLI
tacgen <file.mini> [--tac] [--formats] [--cfg out.dot] [--opt] [--ssa] [--metrics]
       [--live-out a,b,c] [--all]

## Golden tests (must match by hand-verified numbers from the Stage-2 report)
bench/b1.mini: while-loop example. Expect 10 TAC instrs, 4 basic blocks B1={1-2},B2={3},
  B3={4-9},B4={10}; back edge B3->B2; SSA phis for s and i at B2 only.
bench/b2.mini: x=4*5; y=x+3; z=a*8; w=b+c; u=b+c; k=y*2; with --live-out y,z,w,u.
  Unoptimized 12 instrs; after folding+strength reduction+CSE+copy-prop still 12;
  after DCE 6; after temp coalescing 4. Final: y=23; z=a<<3; w=b+c; u=w.
bench/b3.mini: a = b * -c + b * -c;  Unoptimized 6 quads (t1..t5, a=t5).
  CSE removes 2 instrs. Edits: quads 1 operand rewrite, 0 index changes;
  triples 2 operand rewrites and 2 surviving index changes; indirect triples 1 rewrite, 0 changes.
