import { User } from "@/types/user.type";
import { Fornecedor } from "./fornecedor.types";
import { DocumentInstallment } from "./document-installment.type";
import { DocumentSignatory } from "./document-signatory.type";
import { DocumentAllocation } from "./document-allocation.type";
import { FileType } from "./file.type";

export enum DocumentType {
  ADVANCE_PAYMENT = "ADVANCE_PAYMENT", // ADIANTAMENTOS
  BANK_SLIP = "BANK_SLIP", // BOLETO
  CHECK = "CHECK", // CHEQUE
  CREDIT_CARD = "CREDIT_CARD", // CARTÃO DE CRÉDITO
  POST_DATED_CHECK = "POST_DATED_CHECK", // CHEQUE PRÉ DATADO
  TRADE_BILL = "TRADE_BILL", // DUPLICATA
  LOAN = "LOAN", // EMPRÉSTIMO
  PETTY_CASH = "PETTY_CASH", // FUNDO DE CAIXA
  VACATION_PAY = "VACATION_PAY", // FÉRIAS
  SEVERANCE_FUND = "SEVERANCE_FUND", // FGTS
  PAYROLL = "PAYROLL", // FOLHA
  SOCIAL_SECURITY = "SOCIAL_SECURITY", // INSS
  TAXES = "TAXES", // IMPOSTOS
  CREDIT_NOTE = "CREDIT_NOTE", // NOTA DE CRÉDITO
  SUPPLIER_RETURN_NOTE = "SUPPLIER_RETURN_NOTE", // NOTA DE DEVOLUÇÃO FORNECEDOR
  ADVANCE_PAYMENT_TO_SUPPLIER = "ADVANCE_PAYMENT_TO_SUPPLIER", // PAGAMENTO ANTECIPADO
  BRADESCO_HEALTH_PLAN = "BRADESCO_HEALTH_PLAN", // PLANO DE SAÚDE BRADESCO
  FORECAST = "FORECAST", // PREVISÃO
  ADVANCE_RECEIPT = "ADVANCE_RECEIPT", // RECEBIMENTO ANTECIPADO
  RECEIPT = "RECEIPT", // RECIBO
  TERMINATION = "TERMINATION", // RESCISÃO
  HEALTH_PLAN = "HEALTH_PLAN", // PLANO DE SAÚDE
  TRIBUTES = "TRIBUTES", // TRIBUTOS
  FEES = "FEES", // TAXAS
  GENERAL = "GENERAL", // GERAL
}

export enum DocumentStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  DRAFT = "DRAFT",
  REJECTED = "REJECTED",
}

export enum DocumentNature {
  // Despesas com Pessoal
  SALARIES = 'SALARIES',
  SOCIAL_SECURITY = 'SOCIAL_SECURITY', // INSS
  SEVERANCE_FUND = 'SEVERANCE_FUND', // FGTS
  VACATION = 'VACATION',
  THIRTEENTH_SALARY = 'THIRTEENTH_SALARY', // 13 SALARIO
  TRANSPORT_VOUCHERS = 'TRANSPORT_VOUCHERS', // V. TRANSPORTES / VALE TRANSPORTE
  TRAINING = 'TRAINING',
  MEDICATIONS = 'MEDICATIONS',
  HEALTH_DENTAL_PLAN = 'HEALTH_DENTAL_PLAN',
  PERFORMANCE_BONUS = 'PERFORMANCE_BONUS', // PREMIACAO S/ META E AVALIACAO
  OUTSOURCED_SERVICES = 'OUTSOURCED_SERVICES',
  GV_GRATIFICATION = 'GV_GRATIFICATION', // GRATIFICACAO GV (mantido como está por ser um acrônimo)
  EXTRA_GRATIFICATION = 'EXTRA_GRATIFICATION',
  VARIABLE_REMUNERATION_BONUS = 'VARIABLE_REMUNERATION_BONUS', // PREMIO RV ( REMUNERACAO VARIAVEL )
  TEMPORARY_SUPPLIER_SERVICES = 'TEMPORARY_SUPPLIER_SERVICES',
  COOPERATIVE_SERVICES = 'COOPERATIVE_SERVICES',
  OVERTIME = 'OVERTIME',
  ADMISSION_TERMINATION_EXPENSES = 'ADMISSION_TERMINATION_EXPENSES',
  INTERNAL_EVENTS = 'INTERNAL_EVENTS',
  INDEMNITIES = 'INDEMNITIES',
  UNIFORMS = 'UNIFORMS',
  PRO_LABORE = 'PRO_LABORE',
  INTERNSHIP_GRANT = 'INTERNSHIP_GRANT', // BOLSA DE ESTAGIO
  UNHEALTHINESS_ALLOWANCE = 'UNHEALTHINESS_ALLOWANCE', // INSALUBRIDADE
  OCCUPATIONAL_HEALTH_SAFETY = 'OCCUPATIONAL_HEALTH_SAFETY', // MEDICINA E SEGURANCA DO TRABALHO
  EMPLOYEE_LIFE_INSURANCE = 'EMPLOYEE_LIFE_INSURANCE',
  PROFIT_SHARING = 'PROFIT_SHARING', // PARTICIPACAO NOS LUCROS E RESULTADOS

  // Despesas de Marketing e Publicidade
  ADVERTISING_PUBLICITY = 'ADVERTISING_PUBLICITY',
  PROMOTIONAL_GIFTS = 'PROMOTIONAL_GIFTS',
  PARTICIPATION_IN_FAIRS_EVENTS = 'PARTICIPATION_IN_FAIRS_EVENTS',
  DONATIONS_CONTRIBUTIONS = 'DONATIONS_CONTRIBUTIONS',
  MARKET_RESEARCH = 'MARKET_RESEARCH',
  MARKETING_CONSULTANCY = 'MARKETING_CONSULTANCY',
  DIRECT_MARKETING = 'DIRECT_MARKETING',
  BONUSES = 'BONUSES', // BONIFICACAO
  COMMISSIONS_PAID_TO_THIRD_PARTIES = 'COMMISSIONS_PAID_TO_THIRD_PARTIES',

  // Despesas Operacionais e de Manutenção
  TEMPORARY_REDISTRIBUTION_SERVICES = 'TEMPORARY_REDISTRIBUTION_SERVICES',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  CLEANING_PANTRY_SUPPLIES = 'CLEANING_PANTRY_SUPPLIES',
  FUELS_LUBRICANTS = 'FUELS_LUBRICANTS',
  PARTS_TIRES_MAINTENANCE = 'PARTS_TIRES_MAINTENANCE',
  REGISTRATION_INSURANCE_FINES_FEES = 'REGISTRATION_INSURANCE_FINES_FEES', // EMPLACAMENTO / SEGUROS / MULTAS / TAXAS
  LEASING = 'LEASING', // ARRENDAMENTO MERCANTIL - LEASING
  VEHICLE_RENTAL = 'VEHICLE_RENTAL',
  VEHICLE_INSURANCE_EXPENSES = 'VEHICLE_INSURANCE_EXPENSES',
  TELEPHONE_EXPENSES = 'TELEPHONE_EXPENSES',
  ELECTRICITY = 'ELECTRICITY',
  POSTAL_SERVICES = 'POSTAL_SERVICES',
  WATER_SEWAGE = 'WATER_SEWAGE',
  BUILDING_INSTALLATION_EQUIPMENT_MAINTENANCE_REPAIR = 'BUILDING_INSTALLATION_EQUIPMENT_MAINTENANCE_REPAIR',
  IT_MAINTENANCE_SERVICES = 'IT_MAINTENANCE_SERVICES', // SERV. MANUT. INFORMATICA
  VIGILANCE_GENERAL_SERVICES = 'VIGILANCE_GENERAL_SERVICES', // VIGILANCIA E SERVICOS GERAIS

  // Despesas com Consultorias e Serviços Profissionais
  LEGAL_CONSULTANCY = 'LEGAL_CONSULTANCY',
  ACCOUNTING_CONSULTANCY = 'ACCOUNTING_CONSULTANCY',
  HR_CONSULTANCY = 'HR_CONSULTANCY',
  BUSINESS_CONSULTANCY = 'BUSINESS_CONSULTANCY',
  TECHNICAL_CONSULTANCY = 'TECHNICAL_CONSULTANCY',
  ADVERTISEMENTS_PUBLICATIONS = 'ADVERTISEMENTS_PUBLICATIONS',
  RENTS_CONDOMINIUM_FEES = 'RENTS_CONDOMINIUM_FEES',
  NOTARY_JUDICIAL_FEES = 'NOTARY_JUDICIAL_FEES',
  PROPERTY_INSURANCE = 'PROPERTY_INSURANCE',
  NEWSPAPER_MAGAZINE_INTERNET_SUBSCRIPTIONS = 'NEWSPAPER_MAGAZINE_INTERNET_SUBSCRIPTIONS',
  ASSOCIATIONS_CREDIT_BUREAU_FEES = 'ASSOCIATIONS_CREDIT_BUREAU_FEES', // ASSOCIACOES / SPC / SERASA
  SNACKS_MEALS = 'SNACKS_MEALS',
  CONSUMABLE_MATERIALS = 'CONSUMABLE_MATERIALS',
  EXTERNAL_COLLECTION_SERVICES = 'EXTERNAL_COLLECTION_SERVICES',
  LABOR_CONSULTANCY = 'LABOR_CONSULTANCY',
  FINANCIAL_CREDIT_CONSULTANCY = 'FINANCIAL_CREDIT_CONSULTANCY',
  CORPORATE_CONSULTANCY = 'CORPORATE_CONSULTANCY', // ASSESSORIA SOCIETARIA

  // Despesas com Impostos e Taxas
  CORPORATE_INCOME_TAX = 'CORPORATE_INCOME_TAX', // IMPOSTO DE RENDA PESSOA JURIDICA
  SOCIAL_CONTRIBUTION_ON_PROFIT = 'SOCIAL_CONTRIBUTION_ON_PROFIT', // CONTRIBUICAO SOCIAL S/ LUCRO
  DIVERSE_FEES = 'DIVERSE_FEES',
  ICMS_CREDIT_REVERSAL = 'ICMS_CREDIT_REVERSAL',
  OTHER_STATE_TAXES = 'OTHER_STATE_TAXES',
  OTHER_FEDERAL_TAXES = 'OTHER_FEDERAL_TAXES',
  OTHER_MUNICIPAL_TAXES = 'OTHER_MUNICIPAL_TAXES',
  TAX_FINES = 'TAX_FINES', // MULTAS FISCAIS
  TRAFFIC_FINES = 'TRAFFIC_FINES', // MULTAS DE TRANSITO

  // Outras Despesas
  TRAVEL_ACCOMMODATION = 'TRAVEL_ACCOMMODATION',
  CUSTOMER_COMPENSATION = 'CUSTOMER_COMPENSATION',
  PRODUCT_ANALYSIS = 'PRODUCT_ANALYSIS',
  RISK_FUND = 'RISK_FUND',
  VEHICLE_FINANCING_CDC = 'VEHICLE_FINANCING_CDC',
  OTHER_LOSSES = 'OTHER_LOSSES',
  IMPLEMENTATION_PRE_OPERATIONAL_EXPENSES = 'IMPLEMENTATION_PRE_OPERATIONAL_EXPENSES', // GASTOS DE IMPLANTACAO E PRE OPERACIONAIS
  PRODUCT_RESEARCH_DEVELOPMENT_EXPENSES = 'PRODUCT_RESEARCH_DEVELOPMENT_EXPENSES', // GASTOS C/ PESQUISA E DESENVOLV. PRODUTOS
  NON_DEDUCTIBLE_EXPENSES = 'NON_DEDUCTIBLE_EXPENSES',
  UNCOLLECTIBLE_CREDIT_EXPENSE = 'UNCOLLECTIBLE_CREDIT_EXPENSE', // DESPESA COM CREDITOS INCOBRAVEIS
  OTHER_EXPENSES = 'OTHER_EXPENSES',
  TRAVEL_ALLOWANCES = 'TRAVEL_ALLOWANCES', // DIÁRIAS PARA VIAGEM

  // Ativos / Investimentos
  INSTALLATIONS = 'INSTALLATIONS',
  TOOLS = 'TOOLS',
  VEHICLES = 'VEHICLES',
  MOTORCYCLE = 'MOTORCYCLE',
  FURNITURE_UTENSILS = 'FURNITURE_UTENSILS',
  MACHINERY_EQUIPMENT = 'MACHINERY_EQUIPMENT',
  DATA_PROCESSING_SYSTEM_HARDWARE = 'DATA_PROCESSING_SYSTEM_HARDWARE',
  DATA_PROCESSING_SYSTEM_SOFTWARE = 'DATA_PROCESSING_SYSTEM_SOFTWARE',
  TRADEMARKS_PATENTS = 'TRADEMARKS_PATENTS',
  REAL_ESTATE_BUILDINGS = 'REAL_ESTATE_BUILDINGS',
  IMPROVEMENTS_ON_THIRD_PARTY_PROPERTIES = 'IMPROVEMENTS_ON_THIRD_PARTY_PROPERTIES',
  COMPUTERS_PERIPHERALS = 'COMPUTERS_PERIPHERALS',

  // Despesas e Receitas de Frete/Serviços a Clientes
  FREIGHT_CARGO_FOR_CLIENTS = 'FREIGHT_CARGO_FOR_CLIENTS',
  CLIENT_INSURANCE = 'CLIENT_INSURANCE',
  SERVICES_PROVIDED_TO_CLIENTS = 'SERVICES_PROVIDED_TO_CLIENTS',
  INDIVIDUAL_FREIGHT = 'INDIVIDUAL_FREIGHT',
  CORPORATE_FREIGHT = 'CORPORATE_FREIGHT',
  LOADING_UNLOADING_SERVICES_CLIENTS = 'LOADING_UNLOADING_SERVICES_CLIENTS',
  LOADING_UNLOADING_SERVICES_PURCHASES = 'LOADING_UNLOADING_SERVICES_PURCHASES',

  // Receitas
  RECOVERY_OF_UNCOLLECTIBLE_CREDITS = 'RECOVERY_OF_UNCOLLECTIBLE_CREDITS', // RECUPERACAO DE CREDITOS INCOBRAVEIS
  EXPENSE_RECOVERY = 'EXPENSE_RECOVERY',
  COMMISSIONS_RECEIVED = 'COMMISSIONS_RECEIVED',
  RENTAL_INCOME = 'RENTAL_INCOME',
  OTHER_REVENUES = 'OTHER_REVENUES',
}

export const documentNatureLabels: Record<DocumentNature, string> = {
  // Despesas com Pessoal
  [DocumentNature.SALARIES]: 'Salários',
  [DocumentNature.SOCIAL_SECURITY]: 'INSS',
  [DocumentNature.SEVERANCE_FUND]: 'FGTS',
  [DocumentNature.VACATION]: 'Férias',
  [DocumentNature.THIRTEENTH_SALARY]: '13º Salário',
  [DocumentNature.TRANSPORT_VOUCHERS]: 'Vales Transportes',
  [DocumentNature.TRAINING]: 'Treinamentos',
  [DocumentNature.MEDICATIONS]: 'Medicamentos',
  [DocumentNature.HEALTH_DENTAL_PLAN]: 'Convênio Médico / Odontológico',
  [DocumentNature.PERFORMANCE_BONUS]: 'Premiação s/ Meta e Avaliação',
  [DocumentNature.OUTSOURCED_SERVICES]: 'Serviços Terceirizados',
  [DocumentNature.GV_GRATIFICATION]: 'Gratificação GV',
  [DocumentNature.EXTRA_GRATIFICATION]: 'Gratificação Extra',
  [DocumentNature.VARIABLE_REMUNERATION_BONUS]: 'Prêmio RV (Remuneração Variável)',
  [DocumentNature.TEMPORARY_SUPPLIER_SERVICES]: 'Serviços Temporário / Fornecedor',
  [DocumentNature.COOPERATIVE_SERVICES]: 'Serviços de Cooperativa',
  [DocumentNature.OVERTIME]: 'Horas Extras',
  [DocumentNature.ADMISSION_TERMINATION_EXPENSES]: 'Despesas Admissionais / Demissionais',
  [DocumentNature.INTERNAL_EVENTS]: 'Eventos Internos',
  [DocumentNature.INDEMNITIES]: 'Indenizações',
  [DocumentNature.UNIFORMS]: 'Uniformes',
  [DocumentNature.PRO_LABORE]: 'Pró-Labore',
  [DocumentNature.INTERNSHIP_GRANT]: 'Bolsa de Estágio',
  [DocumentNature.UNHEALTHINESS_ALLOWANCE]: 'Insalubridade',
  [DocumentNature.OCCUPATIONAL_HEALTH_SAFETY]: 'Medicina e Segurança do Trabalho',
  [DocumentNature.EMPLOYEE_LIFE_INSURANCE]: 'Seguro de Vida Colaborador',
  [DocumentNature.PROFIT_SHARING]: 'Participação nos Lucros e Resultados',

  // Despesas de Marketing e Publicidade
  [DocumentNature.ADVERTISING_PUBLICITY]: 'Propaganda e Publicidades',
  [DocumentNature.PROMOTIONAL_GIFTS]: 'Brindes Promocionais',
  [DocumentNature.PARTICIPATION_IN_FAIRS_EVENTS]: 'Participação em Feiras e Eventos',
  [DocumentNature.DONATIONS_CONTRIBUTIONS]: 'Donativos e Contribuições',
  [DocumentNature.MARKET_RESEARCH]: 'Pesquisa de Mercado',
  [DocumentNature.MARKETING_CONSULTANCY]: 'Assessoria de Marketing',
  [DocumentNature.DIRECT_MARKETING]: 'Marketing Direto',
  [DocumentNature.BONUSES]: 'Bonificação',
  [DocumentNature.COMMISSIONS_PAID_TO_THIRD_PARTIES]: 'Comissões Pagas a Terceiros',

  // Despesas Operacionais e de Manutenção
  [DocumentNature.TEMPORARY_REDISTRIBUTION_SERVICES]: 'Serviços Temporários/Redistribuição',
  [DocumentNature.OFFICE_SUPPLIES]: 'Material de Escritório',
  [DocumentNature.CLEANING_PANTRY_SUPPLIES]: 'Material de Limpeza e Copa',
  [DocumentNature.FUELS_LUBRICANTS]: 'Combustíveis e Lubrificantes',
  [DocumentNature.PARTS_TIRES_MAINTENANCE]: 'Peças / Pneus / Manutenção',
  [DocumentNature.REGISTRATION_INSURANCE_FINES_FEES]: 'Emplacamento / Seguros / Multas / Taxas',
  [DocumentNature.LEASING]: 'Arrendamento Mercantil - Leasing',
  [DocumentNature.VEHICLE_RENTAL]: 'Aluguel de Veículos',
  [DocumentNature.VEHICLE_INSURANCE_EXPENSES]: 'Despesas de Seguro c/ Veículo',
  [DocumentNature.TELEPHONE_EXPENSES]: 'Despesas Telefônicas',
  [DocumentNature.ELECTRICITY]: 'Energia Elétrica',
  [DocumentNature.POSTAL_SERVICES]: 'Correios',
  [DocumentNature.WATER_SEWAGE]: 'Água / Esgoto',
  [DocumentNature.BUILDING_INSTALLATION_EQUIPMENT_MAINTENANCE_REPAIR]: 'Conser. Rep. Edif./ Instalações/ Equips',
  [DocumentNature.IT_MAINTENANCE_SERVICES]: 'Serv. Manut. Informática',
  [DocumentNature.VIGILANCE_GENERAL_SERVICES]: 'Vigilância e Serviços Gerais',

  // Despesas com Consultorias e Serviços Profissionais
  [DocumentNature.LEGAL_CONSULTANCY]: 'Assessoria Jurídica',
  [DocumentNature.ACCOUNTING_CONSULTANCY]: 'Assessoria Contábil',
  [DocumentNature.HR_CONSULTANCY]: 'Assessoria em RH',
  [DocumentNature.BUSINESS_CONSULTANCY]: 'Assessoria Empresarial',
  [DocumentNature.TECHNICAL_CONSULTANCY]: 'Assessoria Técnica',
  [DocumentNature.ADVERTISEMENTS_PUBLICATIONS]: 'Anúncios e Publicações',
  [DocumentNature.RENTS_CONDOMINIUM_FEES]: 'Aluguéis e Condomínios',
  [DocumentNature.NOTARY_JUDICIAL_FEES]: 'Custas Cartoriais / Judiciais',
  [DocumentNature.PROPERTY_INSURANCE]: 'Seguro Patrimonial',
  [DocumentNature.NEWSPAPER_MAGAZINE_INTERNET_SUBSCRIPTIONS]: 'Assinat. de Jornais / Revistas / Internet',
  [DocumentNature.ASSOCIATIONS_CREDIT_BUREAU_FEES]: 'Associações / SPC / Serasa',
  [DocumentNature.SNACKS_MEALS]: 'Lanches e Refeições',
  [DocumentNature.CONSUMABLE_MATERIALS]: 'Material de Uso e Consumo',
  [DocumentNature.EXTERNAL_COLLECTION_SERVICES]: 'Serviços com Cobrança Externa',
  [DocumentNature.LABOR_CONSULTANCY]: 'Assessoria Trabalhista',
  [DocumentNature.FINANCIAL_CREDIT_CONSULTANCY]: 'Assessoria Financeira/Crédito',
  [DocumentNature.CORPORATE_CONSULTANCY]: 'Assessoria Societária',

  // Despesas com Impostos e Taxas
  [DocumentNature.CORPORATE_INCOME_TAX]: 'Imposto de Renda Pessoa Jurídica',
  [DocumentNature.SOCIAL_CONTRIBUTION_ON_PROFIT]: 'Contribuição Social s/ Lucro',
  [DocumentNature.DIVERSE_FEES]: 'Taxas Diversas',
  [DocumentNature.ICMS_CREDIT_REVERSAL]: 'ICMS - Estorno de Créditos',
  [DocumentNature.OTHER_STATE_TAXES]: 'Outros Tributos Estaduais',
  [DocumentNature.OTHER_FEDERAL_TAXES]: 'Outros Tributos Federais',
  [DocumentNature.OTHER_MUNICIPAL_TAXES]: 'Outros Tributos Municipais',
  [DocumentNature.TAX_FINES]: 'Multas Fiscais',
  [DocumentNature.TRAFFIC_FINES]: 'Multas de Trânsito',

  // Outras Despesas
  [DocumentNature.TRAVEL_ACCOMMODATION]: 'Viagens e Estadas',
  [DocumentNature.CUSTOMER_COMPENSATION]: 'Indenizações a Clientes',
  [DocumentNature.PRODUCT_ANALYSIS]: 'Análise de Produtos',
  [DocumentNature.RISK_FUND]: 'Fundo de Risco',
  [DocumentNature.VEHICLE_FINANCING_CDC]: 'Financiamento Veículos - CDC',
  [DocumentNature.OTHER_LOSSES]: 'Outras Perdas',
  [DocumentNature.IMPLEMENTATION_PRE_OPERATIONAL_EXPENSES]: 'Gastos de Implantação e Pré Operacionais',
  [DocumentNature.PRODUCT_RESEARCH_DEVELOPMENT_EXPENSES]: 'Gastos c/ Pesquisa e Desenvolv. Produtos',
  [DocumentNature.NON_DEDUCTIBLE_EXPENSES]: 'Despesas Indedutíveis',
  [DocumentNature.UNCOLLECTIBLE_CREDIT_EXPENSE]: 'Despesa com Créditos Incobráveis',
  [DocumentNature.OTHER_EXPENSES]: 'Outras Despesas',
  [DocumentNature.TRAVEL_ALLOWANCES]: 'Diárias para Viagem',

  // Ativos / Investimentos
  [DocumentNature.INSTALLATIONS]: 'Instalações',
  [DocumentNature.TOOLS]: 'Ferramentas',
  [DocumentNature.VEHICLES]: 'Veículos',
  [DocumentNature.MOTORCYCLE]: 'Motocicleta',
  [DocumentNature.FURNITURE_UTENSILS]: 'Móveis e Utensílios',
  [DocumentNature.MACHINERY_EQUIPMENT]: 'Máquinas e Equipamentos',
  [DocumentNature.DATA_PROCESSING_SYSTEM_HARDWARE]: 'Sistema Processamento Dados - Hardware',
  [DocumentNature.DATA_PROCESSING_SYSTEM_SOFTWARE]: 'Sistema Processamento Dados - Software',
  [DocumentNature.TRADEMARKS_PATENTS]: 'Marcas e Patentes',
  [DocumentNature.REAL_ESTATE_BUILDINGS]: 'Imóveis / Edificações',
  [DocumentNature.IMPROVEMENTS_ON_THIRD_PARTY_PROPERTIES]: 'Benfeitorias em Imóveis de Terceiros',
  [DocumentNature.COMPUTERS_PERIPHERALS]: 'Computadores e Periféricos',

  // Despesas e Receitas de Frete/Serviços a Clientes
  [DocumentNature.FREIGHT_CARGO_FOR_CLIENTS]: 'Fretes e Cargas para Clientes',
  [DocumentNature.CLIENT_INSURANCE]: 'Seguros para Cliente',
  [DocumentNature.SERVICES_PROVIDED_TO_CLIENTS]: 'Serviços Prestados a Clientes',
  [DocumentNature.INDIVIDUAL_FREIGHT]: 'Frete Pessoa Física',
  [DocumentNature.CORPORATE_FREIGHT]: 'Frete Pessoa Jurídica',
  [DocumentNature.LOADING_UNLOADING_SERVICES_CLIENTS]: 'Serviços de Carga e Descarga - Clientes',
  [DocumentNature.LOADING_UNLOADING_SERVICES_PURCHASES]: 'Serviço de Carga e Descarga sobre Compras',

  // Receitas
  [DocumentNature.RECOVERY_OF_UNCOLLECTIBLE_CREDITS]: 'Recuperação de Créditos Incobráveis',
  [DocumentNature.EXPENSE_RECOVERY]: 'Recuperação de Despesas',
  [DocumentNature.COMMISSIONS_RECEIVED]: 'Comissões Recebidas',
  [DocumentNature.RENTAL_INCOME]: 'Receita de Aluguel',
  [DocumentNature.OTHER_REVENUES]: 'Outras Receitas',
};

export interface Document {
  id: number;
  title: string;
  description: string | null;
  fileId: number;
  file: FileType;
  tipoDocumento: DocumentType;
  natureza: string;
  status: DocumentStatus;
  valor: number | null;
  dataVencimento: Date | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  ownerId: number | null;
  fornecedorId: number | null;
  owner: User
  fornecedor: Fornecedor | null;
  installments: DocumentInstallment[];
  signatories: DocumentSignatory[];
  allocations: DocumentAllocation[];
}

export interface CreateDocumentDTO {
  fileId: number;
  title: string;
  description?: string;
  fornecedorId?: number;
  tipoDocumento?: DocumentType;
  natureza: string;
  valor?: number;
  signatories: {
    userId: number;
    order: number;
  }[];
  dataVencimento?: string;
  observacoes?: string;
  installments: {
    installmentNumber: number;
    amount: number;
    dueDate: string;
    description?: string;
  }[];
  rateio: {
    id: number;
    filial: string;
    centroCusto: string;
    valor: number;
    percentual: number;
  }[];
}