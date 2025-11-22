import type { RouteDoc } from './types';

export interface CodeExample {
	svelte: string;
	curl: string;
	fetch: string;
}

export function generateCodeExamples(doc: RouteDoc, baseUrl: string = ''): CodeExample {
	return {
		svelte: generateSvelteCode(doc, baseUrl),
		curl: generateCurlCode(doc, baseUrl),
		fetch: generateFetchCode(doc, baseUrl)
	};
}

function generateSvelteCode(doc: RouteDoc, baseUrl: string): string {
	const hasFormData = !!doc.formDataSchema;
	const hasBody = doc.bodySchema || hasFormData;
	const requiresAuth = doc.requiresBearer;

	let validationRules = '';
	if (doc.bodySchema) {
		const rules: string[] = [];
		for (const [field, prop] of Object.entries(doc.bodySchema.properties)) {
			const fieldRules: string[] = [];

			if (doc.bodySchema.required.includes(field)) {
				fieldRules.push(`{ rule: 'required', message: '${field} is required' }`);
			}

			if (prop.format === 'email') {
				fieldRules.push(`{ rule: 'email', message: 'Invalid email format' }`);
			} else if (prop.format === 'url') {
				fieldRules.push(`{ rule: 'url', message: 'Invalid URL format' }`);
			} else if (prop.format === 'phone') {
				fieldRules.push(`{ rule: 'phone', message: 'Invalid phone number' }`);
			} else if (prop.format === 'date') {
				fieldRules.push(`{ rule: 'date', message: 'Invalid date format' }`);
			} else if (prop.format === 'password') {
				fieldRules.push(`{ rule: 'strongPassword', message: 'Password must be strong' }`);
			} else if (prop.format === 'creditCard') {
				fieldRules.push(`{ rule: 'creditCard', message: 'Invalid credit card' }`);
			}

			if (prop.type === 'number') {
				fieldRules.push(`{ rule: 'numeric', message: '${field} must be a number' }`);
			}

			if (fieldRules.length > 0) {
				rules.push(`    ${field}: [\n      ${fieldRules.join(',\n      ')}\n    ]`);
			}
		}

		if (rules.length > 0) {
			validationRules = `  validationRules: {\n${rules.join(',\n')}\n  },`;
		}
	}

	let url = baseUrl + doc.path;
	if (doc.params && doc.params.length > 0) {
		url = url.replace(/:(\w+)/g, '${$1}');
	}

	let formFields = '';
	if (hasFormData && doc.formDataSchema) {
		const fields: string[] = [];
		for (const [field, prop] of Object.entries(doc.formDataSchema.properties)) {
			const isRequired = doc.formDataSchema.required.includes(field);

			if (prop.isFile) {
				fields.push(`  <input
    type="file"
    name="${field}"
    ${prop.isMultiple ? 'multiple' : ''}
    ${prop.mimeTypes ? `accept="${prop.mimeTypes.join(',')}"` : ''}
    ${isRequired ? 'required' : ''}
  />`);
			} else {
				const inputType =
					prop.type === 'number'
						? 'number'
						: prop.format === 'email'
							? 'email'
							: prop.format === 'date'
								? 'date'
								: 'text';

				fields.push(`  <TextField
    label="${field.charAt(0).toUpperCase() + field.slice(1)}"
    name="${field}"
    type="${inputType}"
    error={form.errors.${field}}
    ${isRequired ? '' : 'optional'}
  />`);
			}
		}
		formFields = fields.join('\n');
	} else if (doc.bodySchema) {
		const fields: string[] = [];
		for (const [field, prop] of Object.entries(doc.bodySchema.properties)) {
			const inputType =
				prop.type === 'number'
					? 'number'
					: prop.format === 'email'
						? 'email'
						: prop.format === 'date'
							? 'date'
							: prop.format === 'password'
								? 'password'
								: 'text';

			fields.push(`  <TextField
    label="${field.charAt(0).toUpperCase() + field.slice(1)}"
    name="${field}"
    type="${inputType}"
    error={form.errors.${field}}
  />`);
		}
		formFields = fields.join('\n');
	}

	let paramVars = '';
	if (doc.params && doc.params.length > 0) {
		paramVars = '\n  ' + doc.params.map((p) => `let ${p} = $state('');`).join('\n  ');
	}

	const code = `<script lang="ts">
  import { useForm } from 'sappsui';
  import { TextField, Button } from 'sappsui';${paramVars}

  let form = useForm({
${validationRules}
    url: \`${url}\`,
    method: '${doc.method}',
    ${
			requiresAuth
				? `headers: {
      'Authorization': \`Bearer \${localStorage.getItem('token')}\`
    },`
				: ''
		}
    showToast: true,
    onSuccess: (response) => {
      console.log('Success:', response);
    },
    onError: (errors) => {
      console.error('Errors:', errors);
    }
  });
<\/script>

<form bind:this={form.state} class="column gap-4">
${formFields}
  <Button type="submit" loading={form.isSubmitting}>
    Submit
  </Button>
</form>`;

	return code;
}

function generateCurlCode(doc: RouteDoc, baseUrl: string): string {
	let url = baseUrl + doc.path;

	if (doc.params && doc.params.length > 0) {
		for (const param of doc.params) {
			url = url.replace(`:${param}`, `<${param}>`);
		}
	}

	if (doc.queryParams) {
		const queryString = Object.entries(doc.queryParams)
			.map(([key, info]) => `${key}=${info.example}`)
			.join('&');
		url += `?${queryString}`;
	}

	let curlCommand = `curl -X ${doc.method} "${url}"`;

	const headers: string[] = [];

	if (doc.requiresBearer) {
		headers.push(`  -H "Authorization: Bearer <your_token>"`);
	}

	if (doc.bodySchema) {
		headers.push(`  -H "Content-Type: application/json"`);
	}

	if (headers.length > 0) {
		curlCommand += ' \\\n' + headers.join(' \\\n');
	}

	if (doc.bodySchema) {
		const bodyExample = JSON.stringify(doc.bodySchema.example, null, 2).split('\n').join('\n  ');
		curlCommand += ` \\\n  -d '${bodyExample}'`;
	} else if (doc.formDataSchema) {
		const formFields: string[] = [];
		for (const [field, prop] of Object.entries(doc.formDataSchema.properties)) {
			if (prop.isFile) {
				formFields.push(`  -F "${field}=@/path/to/file"`);
			} else {
				formFields.push(`  -F "${field}=<value>"`);
			}
		}
		curlCommand += ' \\\n' + formFields.join(' \\\n');
	}

	return curlCommand;
}

function generateFetchCode(doc: RouteDoc, baseUrl: string): string {
	let url = baseUrl + doc.path;

	if (doc.params && doc.params.length > 0) {
		url = url.replace(/:(\w+)/g, '${$1}');
	}

	let queryParamsCode = '';
	if (doc.queryParams) {
		const params = Object.keys(doc.queryParams);
		queryParamsCode = `\n// Query parameters\nconst queryParams = {\n  ${params.map((p) => `${p}: '${doc.queryParams![p]!.example}'`).join(',\n  ')}\n};\n\nconst queryString = new URLSearchParams(queryParams).toString();\nconst url = \`${url}?\${queryString}\`;\n`;
	} else {
		queryParamsCode = `const url = \`${url}\`;\n`;
	}

	const headers: string[] = [];

	if (doc.bodySchema) {
		headers.push(`  'Content-Type': 'application/json'`);
	}

	if (doc.requiresBearer) {
		headers.push(`  'Authorization': \`Bearer \${localStorage.getItem('token')}\``);
	}

	let headersCode = '';
	if (headers.length > 0) {
		headersCode = `,\n  headers: {\n${headers.join(',\n')}\n  }`;
	}

	let bodyCode = '';
	if (doc.bodySchema) {
		const example = JSON.stringify(doc.bodySchema.example, null, 2)
			.split('\n')
			.map((line, i) => (i === 0 ? line : '  ' + line))
			.join('\n');
		bodyCode = `,\n  body: JSON.stringify(${example})`;
	} else if (doc.formDataSchema) {
		const formFields: string[] = [];
		for (const [field, prop] of Object.entries(doc.formDataSchema.properties)) {
			if (prop.isFile) {
				formFields.push(`  formData.append('${field}', fileInput.files[0]);`);
			} else {
				formFields.push(`  formData.append('${field}', '<value>');`);
			}
		}
		bodyCode = `\n\n// Create FormData\nconst formData = new FormData();\n${formFields.join('\n')}\n\n// ... then use formData as body`;
	}

	const code = `${queryParamsCode}
try {
  const response = await fetch(url, {
    method: '${doc.method}'${headersCode}${bodyCode}
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Error:', error);
}`;

	return code;
}
