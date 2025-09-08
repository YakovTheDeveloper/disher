const { Project, SyntaxKind } = require("ts-morph");
const fs = require("fs");
const path = require("path");

const inputFile = path.resolve("prisma/generated/zod/index.ts");
const outputFile = path.resolve("./types.ts");

const project = new Project();
project.addSourceFileAtPath(inputFile);
const sourceFile = project.getSourceFileOrThrow(inputFile);

const typeLines = [];
const schemaNames = [];

// Collect all exported schemas
sourceFile.getExportedDeclarations().forEach((declarations, name) => {
    declarations.forEach((decl) => {
        if (
            decl.getKind() === SyntaxKind.VariableDeclaration &&
            name.endsWith("Schema")
        ) {
            schemaNames.push(name);
            const typeName = name.replace(/Schema$/, "");
            typeLines.push(`export type ${typeName} = z.infer<typeof ${name}>;`);
        }
    });
});

// Generate final content
const imports = [
    `import { z } from "zod";`,
    `import { ${schemaNames.join(", ")} } from "./prisma/generated/zod";`,
];

const namespaceContent = typeLines
    .map((line) => "  " + line) // keep export, just indent for namespace
    .join("\n");

const content = `${imports.join("\n")}

export namespace ApiInputs {
${namespaceContent}
}
`;

fs.writeFileSync(outputFile, content, "utf-8");
console.log(`✅ Types generated in ${outputFile}`);
