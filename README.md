# AobaJSDS

AobaJSDS is a TypeScript library designed to manage JSON-based files as a dataset. It provides a robust framework for handling structured data in the form of rows and columns, similar to a database table. The library supports features like sorting, filtering, and views, making it ideal for working with tabular data in JSON format.

---

## Features

- **Dataset Management**: Load, parse, and manage JSON-based datasets.
- **Views**: Create and manage multiple views of the dataset.
- **Sorting**: Sort data based on one or more columns.
- **Filtering**: Apply filters to create subsets of the data.
- **Column Management**: Define and manage columns with aliases.
- **Compressed File Support**: Handle `.json.gz` compressed JSON files.
- **TypeScript Support**: Fully typed for better development experience.

---

## Installation

To install the library, use npm or yarn:

```bash
npm install aobajsds
```

or

```bash
yarn add aobajsds
```

---

## Usage

Basic Example

```
import { TableCore } from 'aobajsds';

(async () => {
    const table = new TableCore();

    // Initialize with raw data
    await table.intialize({
        name: 'exampleTable',
        rawData: [
            { id: 1, name: 'John Doe', age: 30 },
            { id: 2, name: 'Jane Smith', age: 25 },
        ],
    });

    console.log('Table Name:', table.name); // Output: exampleTable
    console.log('Rows:', table.rows()); // Output: [{ id: 1, name: 'John Doe', age: 30 }, { id: 2, name: 'Jane Smith', age: 25 }]
})();
```

---

## API Reference

`TableCore`

### Methods:

* `initalize(options: TableOptions): Promise<void>`
    * Intializes the table with the provided options.
    * Options:
        * `name`: Name of the table.
        * `fileName`: Path to a JSON `.json` or `.json.gz` file.
        * `rawData`: Array of objects (JSON) representing the table.
* `columns(options: ViewOptions): ColumnDefinition[]`
    * Retrieves the columns for the specified view.
* `rows(options: ViewOptions): {[key: string]: any}[]`
    * Retrieves the rows for the specified view.
* `sort(options: SortOptions): string | number`
    * Sorts the dataset based on the provided options, and creates a new view.

### Properties:

* `name: string`
    * Gets or sets the name of the table
* `view: string |number`
    * Gets or sets the active view

---

## File Support

AobaJSDS supports the following file types:

* Standard JSON Files `.json`
* Compressed JSON Files `.json.gz`

---

## Development

### Prerequisites

* Node.js (>=14.x)
* TypeScript (>=4.x)
* npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/jchirayil/aobajsds.git
cd aobajsds
```

2. Install dependencies:

```bash
npm install
```

### Build

To build the library, run:

```bash
npm run build
```

### Run Tests

To run the test suite, use:

```bash
npm test
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request.

---

## License

The project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

Special thanks to the contributors and open-source community for their support.

* [JSZip](https://stuk.github.io/jszip) for compressed file handling.

---

## Contact

For questions or support, please open an issue on the [GitHub respository](https://github.com/jchirayil/aobajsds/issues).
