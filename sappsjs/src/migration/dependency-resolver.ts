import type { TableConfig } from '../orm/types';

interface DependencyGraph {
	[tableName: string]: string[];
}

function extractDependencies(schema: TableConfig): string[] {
	const dependencies: string[] = [];

	Object.values(schema.columns).forEach((config) => {
		if ('references' in config && config.references) {
			const referencedTable = config.references.table;
			if (referencedTable !== schema.tableName) {
				dependencies.push(referencedTable);
			}
		}
	});

	return [...new Set(dependencies)];
}

function buildDependencyGraph(schemas: TableConfig[]): DependencyGraph {
	const graph: DependencyGraph = {};

	schemas.forEach((schema) => {
		graph[schema.tableName] = extractDependencies(schema);
	});

	return graph;
}

function topologicalSort(graph: DependencyGraph): string[] {
	const visited = new Set<string>();
	const visiting = new Set<string>();
	const result: string[] = [];

	function visit(node: string, path: string[] = []): void {
		if (visited.has(node)) return;

		if (visiting.has(node)) {
			const cycle = [...path, node].join(' -> ');
			throw new Error(
				`Circular dependency detected: ${cycle}\n` +
					`Tables cannot have circular foreign key references.`
			);
		}

		visiting.add(node);

		const dependencies = graph[node] || [];
		dependencies.forEach((dep) => {
			if (!graph[dep]) {
				throw new Error(
					`Table "${node}" references "${dep}" which doesn't exist in the schema. ` +
						`Make sure to include all related tables.`
				);
			}
			visit(dep, [...path, node]);
		});

		visiting.delete(node);
		visited.add(node);
		result.push(node);
	}

	Object.keys(graph).forEach((node) => visit(node));

	return result;
}

export function sortSchemasByDependencies(schemas: TableConfig[]): TableConfig[] {
	if (schemas.length === 0) return [];
	if (schemas.length === 1) return schemas;

	const graph = buildDependencyGraph(schemas);
	const sortedTableNames = topologicalSort(graph);

	const schemaMap = new Map(schemas.map((s) => [s.tableName, s]));
	return sortedTableNames.map((name) => schemaMap.get(name)!);
}

export function sortSchemasForDrop(schemas: TableConfig[]): TableConfig[] {
	return sortSchemasByDependencies(schemas).reverse();
}
