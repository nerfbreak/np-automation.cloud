export interface Distributor {
  id: string
  name: string
  code: string
  warehouse: string
  contact: string
}

export const distributorsMock: Distributor[] = [
  {
    id: "DIST-001",
    name: "PT. Indomarco Prismatama",
    code: "IMP",
    warehouse: "WH-JKT-01",
    contact: "ops@indomarco.co.id",
  },
  {
    id: "DIST-002",
    name: "PT. Sumber Alfaria Trijaya",
    code: "SAT",
    warehouse: "WH-JKT-02",
    contact: "inventory@alfamart.co.id",
  },
  {
    id: "DIST-003",
    name: "PT. Midi Utama Indonesia",
    code: "MUI",
    warehouse: "WH-TNG-01",
    contact: "stock@alfamidi.co.id",
  },
  {
    id: "DIST-004",
    name: "PT. Hero Supermarket",
    code: "HSM",
    warehouse: "WH-BSD-01",
    contact: "logistics@hero.co.id",
  },
  {
    id: "DIST-005",
    name: "PT. Matahari Putra Prima",
    code: "MPP",
    warehouse: "WH-TNG-02",
    contact: "supply@hypermart.co.id",
  },
]

// Newspage extraction columns (fixed — defined by Newspage portal)
export const newspageColumns = [
  { key: "sku", label: "Product Code" },
  { key: "qty", label: "Stock Available" },
]

// Mock extracted stock data from Newspage
export const mockNewspageStock = [
  { sku: "P-001", productName: "Indomie Goreng 85g", qty: 240 },
  { sku: "P-002", productName: "Indomie Kuah 70g", qty: 180 },
  { sku: "P-003", productName: "Aqua 600ml", qty: 1200 },
  { sku: "P-004", productName: "Teh Botol 250ml", qty: 600 },
  { sku: "P-005", productName: "Biscuit Roma 200g", qty: 360 },
  { sku: "P-006", productName: "Chitato 75g", qty: 480 },
  { sku: "P-007", productName: "Good Day Cappuccino", qty: 144 },
  { sku: "P-008", productName: "Minyak Bimoli 2L", qty: 72 },
]

// Mock distributor stock (simulates uploaded file after parsing)
export const mockDistributorStock = [
  { sku: "P-001", productName: "Indomie Goreng 85g", qty: 240 },
  { sku: "P-002", productName: "Indomie Kuah 70g", qty: 200 }, // mismatch +20
  { sku: "P-003", productName: "Aqua 600ml", qty: 1200 },
  { sku: "P-004", productName: "Teh Botol 250ml", qty: 580 }, // mismatch -20
  { sku: "P-005", productName: "Biscuit Roma 200g", qty: 360 },
  { sku: "P-006", productName: "Chitato 75g", qty: 500 }, // mismatch +20
  { sku: "P-007", productName: "Good Day Cappuccino", qty: 144 },
  { sku: "P-008", productName: "Minyak Bimoli 2L", qty: 60 }, // mismatch -12
]
