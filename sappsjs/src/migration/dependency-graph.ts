import type { TableConfig } from '../orm/types';
import type { DependencyGraph } from './types';
import { extractDependencies } from './schema-utils';

export function buildDependencyGraph(schemas: Record<string, TableConfig>): DependencyGraph {
	const graph: DependencyGraph = {};

	Object.values(schemas).forEach((schema) => {
		graph[schema.tableName] = extractDependencies(schema);
	});

	return graph;
}

export function topologicalSort(graph: DependencyGraph): string[] {
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
					`Table "${node}" references "${dep}" which doesn't exist in the schema.\n` +
						`Make sure to include all related tables in your entities directory.`
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

export function sortSchemasByDependencies(schemas: Record<string, TableConfig>): TableConfig[] {
	const schemaArray = Object.values(schemas);
	if (schemaArray.length === 0) return [];
	if (schemaArray.length === 1) return schemaArray;

	try {
		const graph = buildDependencyGraph(schemas);
		const sortedTableNames = topologicalSort(graph);

		return sortedTableNames
			.map((name) => schemas[name])
			.filter((schema): schema is TableConfig => schema !== undefined);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Schema dependency error: ${error.message}`);
		}
		throw error;
	}
}

export function sortSchemasForDrop(schemas: Record<string, TableConfig>): TableConfig[] {
	return sortSchemasByDependencies(schemas).reverse();
}
