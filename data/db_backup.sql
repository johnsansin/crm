--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "accountNo" character varying(100),
    "accountName" character varying(200) NOT NULL,
    "parentId" character varying(100),
    website character varying(200),
    phone character varying(30),
    "otherPhone" character varying(30),
    fax character varying(30),
    email character varying(100),
    email2 character varying(100),
    "emailOptOut" boolean DEFAULT false NOT NULL,
    "notifyOwner" boolean DEFAULT false NOT NULL,
    employees integer,
    "annualRevenue" numeric(16,2),
    industry character varying(100),
    "accountType" character varying(100),
    ownership character varying(100),
    rating character varying(10),
    "sicCode" character varying(30),
    "tickerSymbol" character varying(30),
    "billingStreet" character varying(200),
    "billingCity" character varying(100),
    "billingState" character varying(100),
    "billingCountry" character varying(100),
    "billingPostalCode" character varying(30),
    "billingPoBox" character varying(50),
    "shippingStreet" character varying(200),
    "shippingCity" character varying(100),
    "shippingState" character varying(100),
    "shippingCountry" character varying(100),
    "shippingPostalCode" character varying(30),
    "shippingPoBox" character varying(50),
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO crm;

--
-- Name: Activity; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Activity" (
    id text NOT NULL,
    subject character varying(255) NOT NULL,
    description text,
    "activityType" character varying(50) DEFAULT 'Task'::character varying NOT NULL,
    status character varying(100),
    priority character varying(50),
    location character varying(255),
    "startAt" timestamp(3) without time zone,
    "endAt" timestamp(3) without time zone,
    "dueAt" timestamp(3) without time zone,
    "reminderAt" timestamp(3) without time zone,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Activity" OWNER TO crm;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    title character varying(200) NOT NULL,
    message text,
    "startsAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "companyId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Announcement" OWNER TO crm;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "assetNo" character varying(100),
    "assetName" character varying(200) NOT NULL,
    "serialNo" character varying(100),
    "tagNumber" character varying(100),
    "datesInService" timestamp(3) without time zone,
    "dateOutOfService" timestamp(3) without time zone,
    "dateSold" timestamp(3) without time zone,
    status character varying(100),
    "shippingMethod" character varying(100),
    "shippingTrackingNumber" character varying(200),
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "accountId" text,
    "contactId" text,
    "productId" text,
    "invoiceId" text,
    "serviceContractId" text,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO crm;

--
-- Name: Attachment; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Attachment" (
    id text NOT NULL,
    "fileName" character varying(500) NOT NULL,
    "filePath" character varying(1000) NOT NULL,
    "fileType" character varying(100),
    "fileSize" integer,
    "moduleName" character varying(100),
    "recordId" text,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Attachment" OWNER TO crm;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "recordId" text,
    action character varying(50) NOT NULL,
    "fieldName" character varying(100),
    "oldValue" text,
    "newValue" text,
    "userId" text,
    "ipAddress" character varying(45),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO crm;

--
-- Name: Campaign; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Campaign" (
    id text NOT NULL,
    "campaignNo" character varying(100),
    "campaignName" character varying(200) NOT NULL,
    "campaignType" character varying(100),
    status character varying(100),
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "closingDate" timestamp(3) without time zone,
    "expectedRevenue" numeric(16,2),
    budget numeric(16,2),
    "actualCost" numeric(16,2),
    "expectedResponse" integer,
    "targetSize" integer,
    sponsor character varying(200),
    "targetAudience" character varying(500),
    "expectedROI" numeric(10,2),
    "actualROI" numeric(10,2),
    "expectedResponseCount" integer,
    "expectedSalesCount" integer,
    "actualResponseCount" integer,
    "actualSalesCount" integer,
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Campaign" OWNER TO crm;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "recordId" text NOT NULL,
    comment text NOT NULL,
    "userId" text,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO crm;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name character varying(200) DEFAULT 'BizForce CRM'::character varying NOT NULL,
    email character varying(100),
    phone character varying(30),
    website character varying(200),
    "addressStreet" character varying(200),
    "addressCity" character varying(100),
    "addressState" character varying(100),
    "addressCountry" character varying(100),
    "addressPostalCode" character varying(30),
    "taxId" character varying(100),
    logo character varying(500),
    "defaultCurrency" character varying(3) DEFAULT 'USD'::character varying,
    timezone character varying(100) DEFAULT 'Asia/Karachi'::character varying NOT NULL,
    "dateFormat" character varying(20) DEFAULT 'mm-dd-yyyy'::character varying NOT NULL,
    facebook character varying(500),
    twitter character varying(500),
    linkedin character varying(500),
    instagram character varying(500),
    youtube character varying(500),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Company" OWNER TO crm;

--
-- Name: Contact; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "contactNo" character varying(100),
    salutation character varying(50),
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    title character varying(100),
    department character varying(100),
    email character varying(100),
    "secondaryEmail" character varying(100),
    phone character varying(30),
    mobile character varying(30),
    "homePhone" character varying(30),
    "otherPhone" character varying(30),
    fax character varying(30),
    assistant character varying(100),
    "assistantPhone" character varying(30),
    dob timestamp(3) without time zone,
    "reportsTo" text,
    "leadSource" character varying(100),
    "doNotCall" boolean DEFAULT false NOT NULL,
    "emailOptOut" boolean DEFAULT false NOT NULL,
    portal boolean DEFAULT false NOT NULL,
    "supportStartDate" timestamp(3) without time zone,
    "supportEndDate" timestamp(3) without time zone,
    "isConvertedFromLead" boolean DEFAULT false NOT NULL,
    "assignedTo" text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    description text,
    "mailingStreet" character varying(200),
    "mailingCity" character varying(100),
    "mailingState" character varying(100),
    "mailingCountry" character varying(100),
    "mailingPostalCode" character varying(30),
    "mailingPoBox" character varying(50),
    "otherStreet" character varying(200),
    "otherCity" character varying(100),
    "otherState" character varying(100),
    "otherCountry" character varying(100),
    "otherPostalCode" character varying(30),
    "otherPoBox" character varying(50),
    "accountId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Contact" OWNER TO crm;

--
-- Name: Currency; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Currency" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(3) NOT NULL,
    symbol character varying(10) NOT NULL,
    rate numeric(10,5) DEFAULT 1 NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Currency" OWNER TO crm;

--
-- Name: CurrencyInfo; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."CurrencyInfo" (
    id text NOT NULL,
    "currencyId" text NOT NULL,
    "relatedId" text NOT NULL,
    "relatedModule" character varying(100) NOT NULL,
    "conversionRate" numeric(10,5) DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CurrencyInfo" OWNER TO crm;

--
-- Name: CustomField; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."CustomField" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    label character varying(200) NOT NULL,
    "fieldName" character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    options jsonb,
    "isRequired" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomField" OWNER TO crm;

--
-- Name: CustomFieldValue; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."CustomFieldValue" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "recordId" text NOT NULL,
    "companyId" text,
    "values" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomFieldValue" OWNER TO crm;

--
-- Name: CustomView; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."CustomView" (
    id text NOT NULL,
    "moduleId" text NOT NULL,
    name character varying(100) NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "userId" text,
    columns jsonb DEFAULT '[]'::jsonb NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
    "orderBy" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomView" OWNER TO crm;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "documentNo" character varying(100),
    title character varying(200) NOT NULL,
    "fileName" character varying(500),
    "fileType" character varying(100),
    "fileSize" integer,
    "filePath" character varying(1000),
    "fileLocationType" character varying(50),
    "fileDownloadCount" integer DEFAULT 0,
    "fileStatus" character varying(50),
    "fileVersion" character varying(50),
    "noteContent" text,
    "folderId" character varying(100),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Document" OWNER TO crm;

--
-- Name: Email; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Email" (
    id text NOT NULL,
    "dateSent" timestamp(3) without time zone,
    subject character varying(500),
    body text,
    "fromEmail" character varying(200),
    "toEmails" text,
    "ccEmails" text,
    "bccEmails" text,
    "emailFlag" character varying(50),
    "parentId" text,
    "parentModule" character varying(100),
    attachments jsonb DEFAULT '[]'::jsonb,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Email" OWNER TO crm;

--
-- Name: EmailTemplate; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."EmailTemplate" (
    id text NOT NULL,
    "templateNo" character varying(100),
    "templateName" character varying(200) NOT NULL,
    subject character varying(500) NOT NULL,
    body text NOT NULL,
    module character varying(100),
    "folderName" character varying(100),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailTemplate" OWNER TO crm;

--
-- Name: Faq; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Faq" (
    id text NOT NULL,
    "faqNo" character varying(100),
    title character varying(500) NOT NULL,
    description text,
    answer text,
    category character varying(100),
    status character varying(100) DEFAULT 'Published'::character varying,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Faq" OWNER TO crm;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    title character varying(200) NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description character varying(500),
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO crm;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "invoiceNo" character varying(100),
    subject character varying(200) NOT NULL,
    "invoiceDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    total numeric(16,2) DEFAULT 0 NOT NULL,
    "subTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    adjustment numeric(16,2) DEFAULT 0 NOT NULL,
    shipping numeric(16,2) DEFAULT 0 NOT NULL,
    "shippingHandling" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxType" character varying(50),
    "grandTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    "customerNo" character varying(100),
    "purchaseOrderNo" character varying(100),
    "salesCommission" numeric(16,2) DEFAULT 0 NOT NULL,
    "exciseDuty" numeric(16,2) DEFAULT 0 NOT NULL,
    "invoiceStatus" character varying(100),
    terms text,
    notes text,
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "accountId" text,
    "contactId" text,
    "salesOrderId" text,
    "billingStreet" character varying(200),
    "billingCity" character varying(100),
    "billingState" character varying(100),
    "billingCountry" character varying(100),
    "billingPostalCode" character varying(30),
    "billingPoBox" character varying(50),
    "shippingStreet" character varying(200),
    "shippingCity" character varying(100),
    "shippingState" character varying(100),
    "shippingCountry" character varying(100),
    "shippingPostalCode" character varying(30),
    "shippingPoBox" character varying(50),
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "quoteId" text
);


ALTER TABLE public."Invoice" OWNER TO crm;

--
-- Name: InvoiceLineItem; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."InvoiceLineItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "productId" text,
    "serviceId" text,
    "itemName" character varying(500) NOT NULL,
    qty numeric(12,2) DEFAULT 1 NOT NULL,
    "listPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "unitPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    tax numeric(16,2) DEFAULT 0 NOT NULL,
    "taxPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    "netPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "lineTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InvoiceLineItem" OWNER TO crm;

--
-- Name: Lead; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "leadNo" character varying(100),
    salutation character varying(50),
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    title character varying(100),
    company character varying(200) NOT NULL,
    email character varying(100),
    "secondaryEmail" character varying(100),
    phone character varying(30),
    mobile character varying(30),
    fax character varying(30),
    website character varying(200),
    "leadSource" character varying(100),
    "leadStatus" character varying(100),
    industry character varying(100),
    "annualRevenue" numeric(16,2),
    "noOfEmployees" integer,
    rating character varying(10),
    "emailOptOut" boolean DEFAULT false NOT NULL,
    interest character varying(200),
    "isConverted" boolean DEFAULT false NOT NULL,
    "convertedAccountId" text,
    "convertedContactId" text,
    "convertedPotentialId" text,
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    street character varying(200),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    "postalCode" character varying(30),
    "poBox" character varying(50),
    "createdBy" text,
    "campaignId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Lead" OWNER TO crm;

--
-- Name: LoginLog; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."LoginLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    email character varying(100) NOT NULL,
    "userName" character varying(100) NOT NULL,
    "ipAddress" character varying(45),
    "publicIp" character varying(45),
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LoginLog" OWNER TO crm;

--
-- Name: Module; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Module" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    label character varying(100) NOT NULL,
    parent character varying(100),
    sequence integer DEFAULT 0 NOT NULL,
    "isEntity" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    icon character varying(50),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Module" OWNER TO crm;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title character varying(200) NOT NULL,
    message text,
    link character varying(500),
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO crm;

--
-- Name: OrgSetting; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."OrgSetting" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrgSetting" OWNER TO crm;

--
-- Name: PermissionProfile; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."PermissionProfile" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    "isActive" boolean DEFAULT true NOT NULL,
    "companyId" text,
    "roleIds" jsonb DEFAULT '[]'::jsonb NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PermissionProfile" OWNER TO crm;

--
-- Name: PicklistOption; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."PicklistOption" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "fieldName" character varying(100) NOT NULL,
    label character varying(200) NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PicklistOption" OWNER TO crm;

--
-- Name: Potential; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Potential" (
    id text NOT NULL,
    "potentialNo" character varying(100),
    "potentialName" character varying(200) NOT NULL,
    amount numeric(16,2),
    "closingDate" timestamp(3) without time zone,
    type character varying(100),
    stage character varying(100),
    probability integer,
    "leadSource" character varying(100),
    "forecastAmount" numeric(16,2),
    "forecastCategory" character varying(100),
    "outcomeAnalysis" character varying(500),
    "nextStep" character varying(500),
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "campaignId" text,
    "accountId" text,
    "contactId" text,
    "productId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Potential" OWNER TO crm;

--
-- Name: PriceBook; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."PriceBook" (
    id text NOT NULL,
    "priceBookNo" character varying(100),
    "priceBookName" character varying(200) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    description text,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PriceBook" OWNER TO crm;

--
-- Name: PriceBookProduct; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."PriceBookProduct" (
    id text NOT NULL,
    "priceBookId" text NOT NULL,
    "productId" text NOT NULL,
    "listPrice" numeric(16,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PriceBookProduct" OWNER TO crm;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "productNo" character varying(100),
    "productName" character varying(200) NOT NULL,
    "productCategory" character varying(100),
    "productType" character varying(100) DEFAULT ''::character varying,
    manufacturer character varying(100),
    website character varying(200),
    "unitPrice" numeric(16,2),
    "costPrice" numeric(16,2),
    "commissionRate" numeric(5,2),
    "commissionPercentage" numeric(5,2),
    "commissionMethod" character varying(50),
    weight numeric(10,2),
    "packSize" integer,
    "qtyInStock" numeric(12,2) DEFAULT 0,
    "qtyOnOrder" numeric(12,2) DEFAULT 0,
    "qtyInDemand" numeric(12,2) DEFAULT 0,
    "reorderLevel" integer,
    "qtyPerUnit" character varying(50),
    "usageUnit" character varying(50),
    "salesStartDate" timestamp(3) without time zone,
    "salesEndDate" timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "supportStartDate" timestamp(3) without time zone,
    "supportEndDate" timestamp(3) without time zone,
    discontinued boolean DEFAULT false NOT NULL,
    "serialNo" character varying(100),
    "mfrPartNo" character varying(100),
    "vendorPartNo" character varying(100),
    "productSheet" character varying(500),
    "glAccount" character varying(100),
    "taxClass" character varying(100),
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    image character varying(500),
    "vendorId" text,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO crm;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    "projectNo" character varying(100),
    "projectName" character varying(200) NOT NULL,
    "projectType" character varying(100),
    description text,
    status character varying(100),
    priority character varying(100),
    progress integer DEFAULT 0,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "actualEndDate" timestamp(3) without time zone,
    "targetBudget" numeric(16,2),
    "actualBudget" numeric(16,2),
    url character varying(500),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "contactId" text,
    "accountId" text,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO crm;

--
-- Name: ProjectMilestone; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."ProjectMilestone" (
    id text NOT NULL,
    "milestoneNo" character varying(100),
    title character varying(500) NOT NULL,
    description text,
    status character varying(100),
    progress integer DEFAULT 0,
    "milestoneDate" timestamp(3) without time zone,
    "milestoneType" character varying(100),
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "projectId" text NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualHours" numeric(10,2),
    "plannedHours" numeric(10,2),
    sequence integer
);


ALTER TABLE public."ProjectMilestone" OWNER TO crm;

--
-- Name: ProjectTask; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."ProjectTask" (
    id text NOT NULL,
    "projectTaskNo" character varying(100),
    title character varying(500) NOT NULL,
    description text,
    status character varying(100),
    priority character varying(100),
    "projectTaskType" character varying(100),
    progress integer DEFAULT 0,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    hours numeric(10,2),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "projectId" text NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProjectTask" OWNER TO crm;

--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."PurchaseOrder" (
    id text NOT NULL,
    "purchaseOrderNo" character varying(100),
    subject character varying(200) NOT NULL,
    "validUntil" timestamp(3) without time zone,
    total numeric(16,2) DEFAULT 0 NOT NULL,
    "subTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    adjustment numeric(16,2) DEFAULT 0 NOT NULL,
    shipping numeric(16,2) DEFAULT 0 NOT NULL,
    "shippingHandling" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxType" character varying(50),
    "grandTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    carrier character varying(100),
    "salesCommission" numeric(16,2) DEFAULT 0 NOT NULL,
    "exciseDuty" numeric(16,2) DEFAULT 0 NOT NULL,
    "poStatus" character varying(100),
    terms text,
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "vendorId" text,
    "contactId" text,
    "billingStreet" character varying(200),
    "billingCity" character varying(100),
    "billingState" character varying(100),
    "billingCountry" character varying(100),
    "billingPostalCode" character varying(30),
    "billingPoBox" character varying(50),
    "shippingStreet" character varying(200),
    "shippingCity" character varying(100),
    "shippingState" character varying(100),
    "shippingCountry" character varying(100),
    "shippingPostalCode" character varying(30),
    "shippingPoBox" character varying(50),
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrder" OWNER TO crm;

--
-- Name: PurchaseOrderLineItem; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."PurchaseOrderLineItem" (
    id text NOT NULL,
    "purchaseOrderId" text NOT NULL,
    "productId" text,
    "serviceId" text,
    "itemName" character varying(500) NOT NULL,
    qty numeric(12,2) DEFAULT 1 NOT NULL,
    "listPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "unitPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    tax numeric(16,2) DEFAULT 0 NOT NULL,
    "taxPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    "netPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "lineTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrderLineItem" OWNER TO crm;

--
-- Name: Quote; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Quote" (
    id text NOT NULL,
    "quoteNo" character varying(100),
    subject character varying(200) NOT NULL,
    "validUntil" timestamp(3) without time zone,
    total numeric(16,2) DEFAULT 0 NOT NULL,
    "subTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    adjustment numeric(16,2) DEFAULT 0 NOT NULL,
    shipping numeric(16,2) DEFAULT 0 NOT NULL,
    "shippingHandling" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxType" character varying(50),
    "grandTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    carrier character varying(100),
    "inventoryManager" character varying(100),
    "quoteStage" character varying(100),
    terms text,
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "accountId" text,
    "contactId" text,
    "potentialId" text,
    "billingStreet" character varying(200),
    "billingCity" character varying(100),
    "billingState" character varying(100),
    "billingCountry" character varying(100),
    "billingPostalCode" character varying(30),
    "billingPoBox" character varying(50),
    "shippingStreet" character varying(200),
    "shippingCity" character varying(100),
    "shippingState" character varying(100),
    "shippingCountry" character varying(100),
    "shippingPostalCode" character varying(30),
    "shippingPoBox" character varying(50),
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Quote" OWNER TO crm;

--
-- Name: QuoteLineItem; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."QuoteLineItem" (
    id text NOT NULL,
    "quoteId" text NOT NULL,
    "productId" text,
    "serviceId" text,
    "itemName" character varying(500) NOT NULL,
    qty numeric(12,2) DEFAULT 1 NOT NULL,
    "listPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "unitPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    tax numeric(16,2) DEFAULT 0 NOT NULL,
    "taxPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    "netPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "lineTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."QuoteLineItem" OWNER TO crm;

--
-- Name: QuoteStageHistory; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."QuoteStageHistory" (
    id text NOT NULL,
    "quoteId" text NOT NULL,
    stage character varying(100) NOT NULL,
    "changedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QuoteStageHistory" OWNER TO crm;

--
-- Name: RelatedList; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."RelatedList" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "relatedModule" character varying(100) NOT NULL,
    label character varying(200) NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RelatedList" OWNER TO crm;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    "parentId" text,
    "companyId" text,
    "isPublic" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO crm;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."RolePermission" (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    view boolean DEFAULT true NOT NULL,
    "create" boolean DEFAULT false NOT NULL,
    edit boolean DEFAULT false NOT NULL,
    delete boolean DEFAULT false NOT NULL,
    import boolean DEFAULT false NOT NULL,
    export boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO crm;

--
-- Name: SalesOrder; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."SalesOrder" (
    id text NOT NULL,
    "salesOrderNo" character varying(100),
    subject character varying(200) NOT NULL,
    "validUntil" timestamp(3) without time zone,
    total numeric(16,2) DEFAULT 0 NOT NULL,
    "subTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    adjustment numeric(16,2) DEFAULT 0 NOT NULL,
    shipping numeric(16,2) DEFAULT 0 NOT NULL,
    "shippingHandling" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(16,2) DEFAULT 0 NOT NULL,
    "taxType" character varying(50),
    "grandTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    carrier character varying(100),
    "soStatus" character varying(100),
    "customerNo" character varying(100),
    "purchaseOrderNo" character varying(100),
    "salesCommission" numeric(16,2) DEFAULT 0 NOT NULL,
    "exciseDuty" numeric(16,2) DEFAULT 0 NOT NULL,
    pending boolean DEFAULT false NOT NULL,
    "enableRecurring" boolean DEFAULT false NOT NULL,
    terms text,
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "accountId" text,
    "contactId" text,
    "potentialId" text,
    "quoteId" text,
    "vendorId" text,
    "billingStreet" character varying(200),
    "billingCity" character varying(100),
    "billingState" character varying(100),
    "billingCountry" character varying(100),
    "billingPostalCode" character varying(30),
    "billingPoBox" character varying(50),
    "shippingStreet" character varying(200),
    "shippingCity" character varying(100),
    "shippingState" character varying(100),
    "shippingCountry" character varying(100),
    "shippingPostalCode" character varying(30),
    "shippingPoBox" character varying(50),
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "endPeriod" timestamp(3) without time zone,
    "recurringFrequency" character varying(50),
    "startPeriod" timestamp(3) without time zone
);


ALTER TABLE public."SalesOrder" OWNER TO crm;

--
-- Name: SalesOrderLineItem; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."SalesOrderLineItem" (
    id text NOT NULL,
    "salesOrderId" text NOT NULL,
    "productId" text,
    "serviceId" text,
    "itemName" character varying(500) NOT NULL,
    qty numeric(12,2) DEFAULT 1 NOT NULL,
    "listPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "unitPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    discount numeric(16,2) DEFAULT 0 NOT NULL,
    "discountPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    tax numeric(16,2) DEFAULT 0 NOT NULL,
    "taxPercent" numeric(5,2) DEFAULT 0 NOT NULL,
    "netPrice" numeric(16,2) DEFAULT 0 NOT NULL,
    "lineTotal" numeric(16,2) DEFAULT 0 NOT NULL,
    sequence integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesOrderLineItem" OWNER TO crm;

--
-- Name: ScheduledTask; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."ScheduledTask" (
    id text NOT NULL,
    name character varying(200) NOT NULL,
    "moduleName" character varying(100),
    frequency character varying(50) NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastRun" timestamp(3) without time zone,
    "nextRun" timestamp(3) without time zone,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScheduledTask" OWNER TO crm;

--
-- Name: SequenceNumber; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."SequenceNumber" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    prefix character varying(50) DEFAULT ''::character varying NOT NULL,
    suffix character varying(50) DEFAULT ''::character varying NOT NULL,
    "currentNo" integer DEFAULT 1 NOT NULL,
    "digitWidth" integer DEFAULT 4 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SequenceNumber" OWNER TO crm;

--
-- Name: Service; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Service" (
    id text NOT NULL,
    "serviceNo" character varying(100),
    "serviceName" character varying(200) NOT NULL,
    "serviceCategory" character varying(100),
    "unitPrice" numeric(16,2),
    "costPrice" numeric(16,2),
    "commissionRate" numeric(5,2),
    "commissionMethod" character varying(50),
    "qtyPerUnit" character varying(50),
    "usageUnit" character varying(50),
    "taxClass" character varying(100),
    "reorderLevel" integer,
    "qtyInStock" numeric(12,2) DEFAULT 0,
    "qtyInDemand" numeric(12,2) DEFAULT 0,
    website character varying(200),
    "serialNo" character varying(100),
    "glAccount" character varying(100),
    discontinued boolean DEFAULT false NOT NULL,
    image character varying(500),
    description text,
    "vendorId" text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Service" OWNER TO crm;

--
-- Name: ServiceContract; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."ServiceContract" (
    id text NOT NULL,
    "contractNo" character varying(100),
    "contractName" character varying(200) NOT NULL,
    "contractType" character varying(100),
    status character varying(100),
    priority character varying(100),
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "renewalDate" timestamp(3) without time zone,
    "trackingUnit" character varying(50),
    "totalUnits" numeric(12,2),
    "usedUnits" numeric(12,2) DEFAULT 0,
    "unitPrice" numeric(16,2),
    "costPrice" numeric(16,2),
    currency character varying(3),
    "relatedTo" text,
    "relatedModule" character varying(100),
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "accountId" text,
    "contactId" text,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ServiceContract" OWNER TO crm;

--
-- Name: SharingRule; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."SharingRule" (
    id text NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "accessType" character varying(50) NOT NULL,
    "roleIds" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SharingRule" OWNER TO crm;

--
-- Name: SmsNotifier; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."SmsNotifier" (
    id text NOT NULL,
    "fromNumber" character varying(30),
    "toNumber" character varying(30),
    message text,
    status character varying(50),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SmsNotifier" OWNER TO crm;

--
-- Name: Tag; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Tag" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    module character varying(100),
    "recordId" text,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Tag" OWNER TO crm;

--
-- Name: TaxInfo; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."TaxInfo" (
    id text NOT NULL,
    "taxName" character varying(100) NOT NULL,
    "taxRate" numeric(5,2) NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TaxInfo" OWNER TO crm;

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "ticketNo" character varying(100),
    title character varying(200) NOT NULL,
    description text,
    solution text,
    "updateLog" text,
    status character varying(100),
    priority character varying(100),
    severity character varying(100),
    category character varying(100),
    hours numeric(10,2),
    days integer,
    "fromMail" character varying(200),
    "versionId" character varying(100),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "contactId" text,
    "accountId" text,
    "productId" text,
    "serviceContractId" text,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO crm;

--
-- Name: User; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "userName" character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(30),
    mobile character varying(30),
    title character varying(100),
    department character varying(100),
    "addressStreet" character varying(200),
    "addressCity" character varying(100),
    "addressState" character varying(100),
    "addressCountry" character varying(100),
    "addressPostalCode" character varying(30),
    timezone character varying(100) DEFAULT 'Asia/Karachi'::character varying NOT NULL,
    language character varying(10) DEFAULT 'en_us'::character varying NOT NULL,
    avatar character varying(500),
    "isActive" boolean DEFAULT true NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "resetToken" character varying(255),
    "resetTokenExpires" timestamp(3) without time zone,
    "roleId" text,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "currencyCode" character varying(3),
    "dateFormat" character varying(20),
    "defaultModule" character varying(100),
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "hourFormat" character varying(10),
    "lockedUntil" timestamp(3) without time zone,
    "startOfWeek" character varying(10),
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" character varying(500)
);


ALTER TABLE public."User" OWNER TO crm;

--
-- Name: UserGroup; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."UserGroup" (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserGroup" OWNER TO crm;

--
-- Name: UserGroupMember; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."UserGroupMember" (
    id text NOT NULL,
    "groupId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserGroupMember" OWNER TO crm;

--
-- Name: UserProfile; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."UserProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "isSuperAdmin" boolean DEFAULT false NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserProfile" OWNER TO crm;

--
-- Name: Vendor; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Vendor" (
    id text NOT NULL,
    "vendorNo" character varying(100),
    "vendorName" character varying(200) NOT NULL,
    email character varying(100),
    phone character varying(30),
    mobile character varying(30),
    website character varying(200),
    category character varying(100),
    "glAccount" character varying(100),
    street character varying(200),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    "postalCode" character varying(30),
    description text,
    "companyId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedTo" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Vendor" OWNER TO crm;

--
-- Name: Webform; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Webform" (
    id text NOT NULL,
    name character varying(200) NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    "successMessage" character varying(500),
    "redirectUrl" character varying(500),
    "isActive" boolean DEFAULT true NOT NULL,
    token character varying(100) NOT NULL,
    "companyId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Webform" OWNER TO crm;

--
-- Name: Workflow; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public."Workflow" (
    id text NOT NULL,
    name character varying(200) NOT NULL,
    "moduleName" character varying(100) NOT NULL,
    "triggerType" character varying(50) NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "companyId" text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Workflow" OWNER TO crm;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: crm
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO crm;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Account" (id, "accountNo", "accountName", "parentId", website, phone, "otherPhone", fax, email, email2, "emailOptOut", "notifyOwner", employees, "annualRevenue", industry, "accountType", ownership, rating, "sicCode", "tickerSymbol", "billingStreet", "billingCity", "billingState", "billingCountry", "billingPostalCode", "billingPoBox", "shippingStreet", "shippingCity", "shippingState", "shippingCountry", "shippingPostalCode", "shippingPoBox", description, "companyId", "isActive", "createdBy", "assignedTo", "createdAt", "updatedAt") FROM stdin;
0bb7860f-7661-408d-8b69-31e0ba0453a0	a1	Account - 1	acc	\N	1	1	\N	\N	\N	f	f	5	1.00	Apparel	Prospect	a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	saaa	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 13:46:45.414	2026-07-30 13:46:45.414
1e262a86-2f26-4c90-95fd-d2d07b7cb729	a2	Account - 2	acc-2	\N	\N	\N	\N	\N	\N	f	f	0	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 13:47:08.727	2026-07-30 13:47:08.727
60ed9ec6-137c-48a9-9963-9f44f6424829	QT-001	Quotation	\N	\N	\N	\N	\N	\N	\N	f	f	0	0.00	\N	Customer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 13:57:58.228	2026-08-02 13:57:58.228
\.


--
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Activity" (id, subject, description, "activityType", status, priority, location, "startAt", "endAt", "dueAt", "reminderAt", "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
51ff83a8-3393-4a92-a610-a08b67bb7c62	Team standup	\N	Meeting	Planned	High	Conf Room	2026-08-04 10:00:00	2026-08-04 11:00:00	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:33:14.618	2026-08-03 14:33:16.344
8f11faea-1cff-4540-b52a-09a07d8eb537	Prepare proposal	\N	Task	In Progress	Medium	\N	\N	\N	2026-08-04 17:00:00	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:33:15.66	2026-08-03 14:33:16.518
8e108bd4-6c1d-47cf-b8a9-b7ebc314f627	New task for calender testing	this task for calender testing	Task	Planned	Medium	\N	\N	\N	2026-08-05 04:00:00	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:38:30.21	2026-08-03 14:38:30.21
593992ac-0b13-49b9-81ea-513c4406cd6f	this is event for calender testing	testing	Meeting	Not Held	High	online	2026-08-03 04:00:00	2026-08-04 05:00:00	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:39:24.353	2026-08-03 14:39:24.353
bf04e250-0106-457f-98e6-03e763d7ca10	UI E2E 1785768194618-edited		Meeting	Planned	Medium		2026-08-03 04:00:00	2026-08-03 05:00:00	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:43:30.916	2026-08-03 14:43:41.59
3d7d1a50-5440-44f5-ae05-a2d5b4496705	UI E2E 1785768194618-edited		Meeting	Planned	Medium		2026-08-03 04:00:00	2026-08-03 05:00:00	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:43:53.827	2026-08-03 14:44:06.446
c8b48d01-38ca-4675-99c9-a6bb37b7d624	Upcoming widget 1785768288096	\N	Meeting	Planned	Medium	\N	2026-08-06 14:44:48.097	2026-08-06 14:44:48.097	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:45:04.744	2026-08-03 14:45:07.703
cc63c7f4-9edd-4783-983d-56a6eb631298	Upcoming widget 1785768288096	\N	Meeting	Planned	Medium	\N	2026-08-06 14:44:48.097	2026-08-06 14:44:48.097	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:45:17.922	2026-08-03 14:45:20.353
07a0164d-a663-4a4e-bf1e-a3ca89d03370	E2E calendar check 1785768119180	\N	Meeting	Planned	Medium	\N	2026-08-03 10:00:00	2026-08-03 11:00:00	2026-08-03 11:00:00	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:41:59.207	2026-08-03 14:45:34.12
f7ed2b09-25f6-493d-b3e7-aa40a77d4eb6	E2E calendar check 1785768132695	\N	Meeting	Planned	Medium	\N	2026-08-03 10:00:00	2026-08-03 11:00:00	2026-08-03 11:00:00	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:42:12.722	2026-08-03 14:45:34.175
\.


--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Announcement" (id, title, message, "startsAt", "expiresAt", "isActive", "companyId", "createdBy", "createdAt", "updatedAt") FROM stdin;
d8c9ac52-2942-44a8-aa7a-08292c72a3b7	New Announce - title	this is announcement and working	2026-08-02 14:08:00	2026-08-04 14:08:00	t	ec25bc6d-9e61-4edd-8949-937bf1869321	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 11:25:09.421	2026-08-03 14:08:17.404
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Asset" (id, "assetNo", "assetName", "serialNo", "tagNumber", "datesInService", "dateOutOfService", "dateSold", status, "shippingMethod", "shippingTrackingNumber", description, "companyId", "isActive", "accountId", "contactId", "productId", "invoiceId", "serviceContractId", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Attachment; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Attachment" (id, "fileName", "filePath", "fileType", "fileSize", "moduleName", "recordId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."AuditLog" (id, "moduleName", "recordId", action, "fieldName", "oldValue", "newValue", "userId", "ipAddress", "createdAt") FROM stdin;
f0a6520e-8b0f-4da6-a1c6-b5c88d1b85d2	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 10:59:18.994
dee5b79c-cf89-4584-bc94-c3499414fc31	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 11:02:34.902
01185ee2-c829-42eb-b0a0-f77f36f46d7a	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 11:02:44.283
ffe26f41-1d1d-4039-a2e2-a450c3bc6537	leads	4cb2c664-980b-4138-8365-c683c783ac4e	CREATE	\N	\N	{"id":"4cb2c664-980b-4138-8365-c683c783ac4e","firstName":"My Leads","lastName":"sfsddf","company":"a","title":"a","email":"aa@gmail.com","secondaryEmail":null,"phone":null,"mobile":null,"fax":null,"website":null,"leadSource":null,"leadStatus":null,"industry":null,"annualRevenue":0,"noOfEmployees":0,"rating":null,"interest":null,"description":null,"street":null,"city":null,"state":null,"country":null,"postalCode":null,"poBox":null,"companyId":"ec25bc6d-9e61-4edd-8949-937bf1869321","createdBy":"45c4684d-b1be-4ede-9675-8d0517609ce5","assignedTo":"45c4684d-b1be-4ede-9675-8d0517609ce5"}	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 11:35:30.323
8bd4ada4-d467-4b97-ac24-583e81889823	leads	4cb2c664-980b-4138-8365-c683c783ac4e	UPDATE	leadSource	\N	Cold Call	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 11:35:47.161
b78bd0ad-703c-47eb-9c30-75b21e005eb4	leads	4cb2c664-980b-4138-8365-c683c783ac4e	UPDATE	leadStatus	\N	Follow Up	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 11:35:47.175
5c380cc4-fe81-4b64-9018-7aa11676f00b	settings	\N	UPDATE	org	\N	["terms"]	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 11:36:27.551
4f9630f9-c4cd-4ead-9b7e-bb127835b925	settings	\N	UPDATE	org	\N	["terms"]	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 11:37:13.294
bec16fb9-383f-423d-9b21-072419059137	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:40:45.196
1b3aa5c9-6cbd-425e-afd6-810157773c63	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:41:14.63
f78075ec-4435-4fdd-9816-f19f0bef4034	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 11:42:35.936
858072e6-fcef-42fb-b64e-f655db1c3a0d	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:54:15.589
adb1e7d7-c78e-4ecb-8de6-abf34025d5e0	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:55:41.263
fb914cb6-cddf-4ccd-8f7f-9d6e3f8b8cea	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:56:36.329
a4e76b35-ca4e-4369-8643-780d3b525fd7	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:56:58.452
9190144c-7611-4b3e-97e3-f1321a8dfba7	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:57:37.845
ebcb2b08-5177-48fa-93a3-7b6f793157d0	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 11:58:05.296
2880c065-9b6e-4259-89db-a5cea4685133	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 12:03:47.987
d3d43104-44d6-4ed2-9f14-48cf868c9f34	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:06:55.877
0bfc937d-ef61-49f9-9987-6306e123cff7	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:08:17.24
06fa0a44-5bde-4260-a375-a261049f3ca6	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:13:43.516
639f4857-af0f-4d75-b621-3ae186b5c45f	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:14:50.635
a9a10143-5fc8-4860-b044-871a92c68021	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:15:16.533
a3f3783d-cf4c-4602-9fb9-362b33a1405e	settings	\N	UPDATE	org	\N	["terms"]	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:15:19.075
cfc645dc-975c-4553-88b4-777e2d087765	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:16:48.252
0088f850-c308-4ae7-9af7-031ddb542e3a	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:18:09.772
fb352c2d-2e90-4a99-9423-6309a82921a8	settings	\N	UPDATE	org	\N	["terms"]	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:18:12.852
808296ed-dc12-47df-af1b-bb44d61067b4	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 12:18:27.959
16391794-715c-40ae-b405-1f3766a74252	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 12:18:42.601
efc053b7-1903-4fa1-a185-1b8665e654ab	auth	\N	LOGIN_FAILED	\N	\N	admin@bizforce.onlin	\N	192.168.2.31	2026-08-03 12:22:17.384
b2500267-cfd1-4a87-bf94-687388b1e65d	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 12:22:23.485
85fca953-085c-430f-863a-a94f48cea96b	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 12:22:28.616
386592d3-ca6e-4452-bc3e-676625c42ec9	settings	\N	UPDATE	org	\N	["terms"]	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 12:23:25.097
af2cade1-9e84-4774-95e5-eae51a2e4b6b	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 12:25:19.18
e98bdccc-ec3e-4f0b-82e8-fb736fc811de	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 12:28:07.346
3b2118f1-8329-4949-9947-c27b1fe13e8e	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 12:53:13.517
00d791c9-4d48-4e0f-9bbb-b81b3d00eac7	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 12:55:44.562
b4158859-956d-45cd-ae69-1751e06e1ed4	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 12:56:00.541
b09fd879-4e23-4753-b826-452f89ab55d4	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 12:56:25.74
964d6518-213a-4fc7-bc3e-4305828310b1	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 12:57:01.557
cc0fc277-7b0c-496c-b683-bd0beadc549e	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 12:58:15.37
b6937e98-c42a-4d81-8b72-fd8ba09200c5	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:07:52.475
2924cbf3-885e-47bb-b5f7-4bc6c3258238	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 13:08:06.019
697c77b2-5b59-4099-ac26-c0ecab3962c8	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 13:08:14.943
438f5f2e-94a8-450e-bd57-31a4fe147c49	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 13:08:26.919
a1245855-b8af-407e-aca4-47f27f5d089f	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 13:10:25.241
55946a07-c644-49d3-828d-7fbf5e6acc20	auth	\N	LOGIN	\N	\N	suhail@gmail.com	afb943a9-ec94-4913-ad96-086f80c0bb3c	192.168.2.31	2026-08-03 13:11:26.686
80dce908-cad5-40cf-8dd9-108dc5e05f38	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 13:11:47.699
db1035cc-83dc-4af6-bfc1-d4afb1aa0cd0	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 13:12:05.494
d26b98fd-35e1-4797-98c9-56b360358cc2	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:14:35.913
50c2971b-ce08-4e80-b37e-d3ec66db0b98	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 13:14:36.281
e4fc53b6-293d-46df-ba7f-1dde3801dade	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:16:01.856
a6501d64-f828-4024-87b0-ba95044b88de	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 13:16:13.405
434d6228-08a3-4ca2-8167-ee575f9c2013	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 13:16:21.378
00757814-2ce0-4054-99ed-be504b59fca5	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 13:16:31.098
28c3e94a-df0f-4fd2-81e2-0cae84940b64	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:18:29.864
63fadc6d-0798-4666-ad98-4b952784eabe	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 13:18:42.474
8698c195-75a0-4cb8-a8d8-e5f1871f68a3	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 13:18:50.659
9e2f8f5c-59ce-4992-a5de-75467015c37c	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 13:19:01.195
63a75000-b7fe-4796-b4bc-f5de162f6004	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 13:33:24.685
df06ef5b-3159-4be3-bb42-1266a84e0698	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 13:34:28.606
888a29db-1160-41ae-9304-9ea822ba976f	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:38:33.869
00e69094-de84-4d14-974b-10eea7710960	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 13:38:50.058
10b9e3ca-d699-44a7-b0c0-c323b6371b43	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 13:38:57.885
59c49caf-792a-4ce1-8177-6d96b0f8cfa7	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 13:39:14.264
aec36d06-58c6-487e-8251-0035e0efebd2	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:39:41.104
ed11ccd2-4802-40e6-960c-3e0fbc9b6f5f	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 13:39:53.452
1d40403c-cfc6-4cde-b8fc-32beb3be4ae4	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 13:40:01.587
64b70e4b-b71f-4b79-ab82-7917bf03580c	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 13:40:12.169
415310ad-ce22-4b53-b4d5-d728ad1e27b7	settings	\N	BACKUP	\N	\N	bizforce-backup-2026-08-03T13-50-01-229Z.sql	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 13:50:10.373
90a728f3-21e6-4572-aa98-627cfbcbd47d	settings	\N	BACKUP	\N	\N	bizforce-backup-2026-08-03T13-50-21-895Z.sql	041fb45b-8f4e-430e-90fc-1059ecb8baa8	192.168.2.31	2026-08-03 13:50:23.384
f19bf714-e14c-483b-a043-275c7e6f17e1	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:52:24.004
34eb346b-c518-4250-ac5d-bf9ccc211db7	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:53:33.313
b1d868a9-8d22-4fb8-abd9-b0961f053a9d	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	127.0.0.1	2026-08-03 13:53:58.752
6083b866-3bba-4e2a-a117-e36f35146c88	auth	\N	LOGIN	\N	\N	superadmin@bizforce.online	041fb45b-8f4e-430e-90fc-1059ecb8baa8	::1	2026-08-03 13:54:17.015
4c1b52ad-5a4c-4af1-a412-5b8cffec5542	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 13:55:50.013
5366fa17-2455-4d34-9ce9-2fc1a6f66d86	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:02:02.254
8880ff1c-5b7c-4490-a9f9-f0c55ca08e60	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:02:07.498
30208331-a4f5-4e60-abb1-ae23576f9c52	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:03:52.616
9e4e4d38-68f9-4c4e-b0e4-c5b18542a5fe	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 14:04:02.935
f49d0a3b-2e22-45ed-a18a-d3cf066c5630	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:05:30.652
3296c4e6-cdec-4f88-8307-27b118527ba7	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 14:05:43.595
6c1c62bf-9994-4dba-85c1-b10b30e3768e	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:13:57.158
89646df7-437d-4533-aaa0-46c57c56005d	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:14:12.069
f90e11de-98e6-4d78-b6c6-72a831859cd7	tickets	d7234cd9-bcff-4db9-967e-68442d34597a	CREATE	\N	\N	{"id":"d7234cd9-bcff-4db9-967e-68442d34597a","title":"Widget test open ticket","status":"Open","priority":"High","companyId":"ec25bc6d-9e61-4edd-8949-937bf1869321","createdBy":"45c4684d-b1be-4ede-9675-8d0517609ce5","assignedTo":"45c4684d-b1be-4ede-9675-8d0517609ce5"}	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:14:12.187
1e0561ed-79c8-4d24-9251-c08190a4ff0b	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:14:36.118
a5e695f0-0dba-4269-b47b-fc01d30e1499	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:17:17.575
a12347a0-d785-4ea9-b6da-62681021baf4	tickets	64d1fc9c-91f8-408e-8439-b9ce84dae242	CREATE	\N	\N	{"id":"64d1fc9c-91f8-408e-8439-b9ce84dae242","title":"Open ticket from dashboard demo","status":"Open","priority":"High","companyId":"ec25bc6d-9e61-4edd-8949-937bf1869321","createdBy":"45c4684d-b1be-4ede-9675-8d0517609ce5","assignedTo":"45c4684d-b1be-4ede-9675-8d0517609ce5"}	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:17:17.675
a919c8e7-f0d6-4ca8-8dea-b17f67f35f47	potentials	a5441836-ac02-4681-81cd-5e09f8f966ce	CREATE	\N	\N	{"id":"a5441836-ac02-4681-81cd-5e09f8f966ce","potentialName":"Widget demo opportunity","amount":25000,"stage":"Negotiation","closingDate":"2026-09-30T07:00:00.000Z","companyId":"ec25bc6d-9e61-4edd-8949-937bf1869321","createdBy":"45c4684d-b1be-4ede-9675-8d0517609ce5","assignedTo":"45c4684d-b1be-4ede-9675-8d0517609ce5"}	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:17:17.824
970eb21b-6367-4c1f-a6e6-27f26320ca31	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:18:01.083
8b11ff43-fbf2-4d74-add8-4f08360de3d4	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 14:18:10.213
b631c177-c908-4332-9e31-9cf75f22be46	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:18:28.275
1039e4a2-5bd5-4011-ac97-2d7a0884ee54	tickets	64d1fc9c-91f8-408e-8439-b9ce84dae242	DELETE	\N	{"id":"64d1fc9c-91f8-408e-8439-b9ce84dae242"}	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:18:28.335
a5edc359-7d39-4ae0-ba2a-a52b6743e568	potentials	a5441836-ac02-4681-81cd-5e09f8f966ce	DELETE	\N	{"id":"a5441836-ac02-4681-81cd-5e09f8f966ce"}	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:18:28.408
fffa6204-a217-41f8-887e-6f0c1ec8130c	tickets	d7234cd9-bcff-4db9-967e-68442d34597a	DELETE	\N	{"id":"d7234cd9-bcff-4db9-967e-68442d34597a"}	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:18:28.468
b44635b3-5a51-49e0-8524-ecac28d774cb	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:18:47.807
c6b414eb-e312-413d-97aa-5a11e25d9a15	tickets	d603482d-f572-4754-8ad9-40f9deecfdcd	CREATE	\N	\N	{"id":"d603482d-f572-4754-8ad9-40f9deecfdcd","title":"new ticket","description":null,"status":"Open","priority":"High","severity":"Critical","category":"General","solution":null,"updateLog":null,"hours":10,"days":2,"fromMail":null,"versionId":null,"companyId":"ec25bc6d-9e61-4edd-8949-937bf1869321","createdBy":"45c4684d-b1be-4ede-9675-8d0517609ce5","assignedTo":"45c4684d-b1be-4ede-9675-8d0517609ce5"}	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 14:31:09.805
165d720d-6092-4038-96de-6dcf731d3781	tickets	98ead80c-c085-4fd8-b543-79a6e881da86	CREATE	\N	\N	{"id":"98ead80c-c085-4fd8-b543-79a6e881da86","title":"Ticket for CRM deployment","description":null,"status":"Open","priority":"Urgent","severity":"Feature","category":"General","solution":null,"updateLog":null,"hours":50,"days":10,"fromMail":null,"versionId":null,"companyId":"ec25bc6d-9e61-4edd-8949-937bf1869321","createdBy":"45c4684d-b1be-4ede-9675-8d0517609ce5","assignedTo":"45c4684d-b1be-4ede-9675-8d0517609ce5"}	45c4684d-b1be-4ede-9675-8d0517609ce5	192.168.2.31	2026-08-03 14:31:40.129
c0159b70-64f7-49ee-b1fa-711d4e600e9e	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:33:14.396
a6ed51bc-91f3-4aa3-87cb-0b1c43445a37	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:41:54.132
deb7f7c2-b9ba-4a1c-8fd0-be1c8d9fa14f	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 14:42:07.871
891df284-994d-4df0-bef3-7c844412332c	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:43:22.837
31210cda-db4f-47cd-9974-421012440834	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 14:43:46.899
8208a1bb-5a83-4102-afcf-34b6cbd3511b	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:45:00.865
0f6f1fe0-c91a-4616-a794-77d787d37810	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	::1	2026-08-03 14:45:13.294
79a26c15-6906-428b-8945-94ca806dfdb1	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:45:28.792
bff721d4-6adf-4638-b62f-a220d7233bbc	auth	\N	LOGIN	\N	\N	admin@bizforce.online	45c4684d-b1be-4ede-9675-8d0517609ce5	127.0.0.1	2026-08-03 14:45:34.054
\.


--
-- Data for Name: Campaign; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Campaign" (id, "campaignNo", "campaignName", "campaignType", status, "startDate", "endDate", "closingDate", "expectedRevenue", budget, "actualCost", "expectedResponse", "targetSize", sponsor, "targetAudience", "expectedROI", "actualROI", "expectedResponseCount", "expectedSalesCount", "actualResponseCount", "actualSalesCount", description, "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
043742ef-431b-4ecc-a346-5ec0c3bbe9d6	\N	test compaign	Marketing	Planning	2026-08-04 07:00:00	2026-08-23 07:00:00	2026-08-25 07:00:00	10.00	20.00	8.00	1	10	sponsor	university students	5000.00	4000.00	\N	\N	\N	\N	fasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasd	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:43:02.273	2026-08-02 14:43:12.474
7d4038fe-a712-40b0-bf38-cf9d8e3994d2	\N	10% Discount Compaign	Marketing	Active	2026-08-04 07:00:00	2026-08-12 07:00:00	2026-08-18 07:00:00	50000.00	2000.00	2500.00	50	10	1	1	10.00	50.00	\N	\N	\N	\N	fdfsfsdff	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 09:46:25.087	2026-08-03 09:47:10.909
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Comment" (id, "moduleName", "recordId", comment, "userId", "isPrivate", "createdAt", "updatedAt") FROM stdin;
91f4c6d9-6a24-4970-8e57-8e5f0ad952d9	quotes	8e5a0e40-9959-4652-948a-8c34879526cb	Please review pricing	45c4684d-b1be-4ede-9675-8d0517609ce5	f	2026-08-02 14:00:38.276	2026-08-02 14:00:38.276
93821810-a1a7-4676-aecc-0125385bba88	quotes	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	ok	45c4684d-b1be-4ede-9675-8d0517609ce5	f	2026-08-02 14:39:11.028	2026-08-02 14:39:11.028
8e80d2d1-10cb-4edc-9f2d-874c9dae939c	quotes	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	check it	45c4684d-b1be-4ede-9675-8d0517609ce5	f	2026-08-02 14:39:15.87	2026-08-02 14:39:15.87
cbb7887b-b051-4422-8ba2-7c0e69018168	invoices	d989e6f2-0ead-4317-8c64-a3437275d6df	Invoice comment test	45c4684d-b1be-4ede-9675-8d0517609ce5	f	2026-08-02 14:54:22.026	2026-08-02 14:54:22.026
78f1382f-f52c-4027-95ce-d2e87b54271f	quotes	97c8a982-717f-466c-aa47-522cc3af3999	sale order created	afb943a9-ec94-4913-ad96-086f80c0bb3c	f	2026-08-03 06:14:45.824	2026-08-03 06:14:45.824
ac43679e-9581-49fb-a725-cb13e0eea78f	invoices	809c91ec-faef-4e75-9580-ed64baa7e31e	ok	afb943a9-ec94-4913-ad96-086f80c0bb3c	f	2026-08-03 06:59:39.564	2026-08-03 06:59:39.564
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Company" (id, name, email, phone, website, "addressStreet", "addressCity", "addressState", "addressCountry", "addressPostalCode", "taxId", logo, "defaultCurrency", timezone, "dateFormat", facebook, twitter, linkedin, instagram, youtube, "createdAt", "updatedAt", "isActive") FROM stdin;
6d7b961f-d42f-4a58-9738-af85339d1e2b	textylers	textylers@gmail.com	1	1	Lahore	Lahore	Punjab	Pakistan	54000	1	/uploads/1785418786630-j8ykhp.png	PKR	Asia/Karachi	dd-mm-yyyy	\N	\N	\N	\N	\N	2026-07-30 13:16:02.403	2026-07-30 13:39:14.402	t
ec25bc6d-9e61-4edd-8949-937bf1869321	BizForce Online	bizforce@gmail.com	\N	\N	\N	\N	\N	Pakistan	\N	\N	/uploads/1785400296469-urpjpn.png	PKR	Asia/Karachi	dd-mm-yyyy	\N	\N	\N	\N	\N	2026-07-30 07:18:02.359	2026-08-02 09:13:11.171	t
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Contact" (id, "contactNo", salutation, "firstName", "lastName", title, department, email, "secondaryEmail", phone, mobile, "homePhone", "otherPhone", fax, assistant, "assistantPhone", dob, "reportsTo", "leadSource", "doNotCall", "emailOptOut", portal, "supportStartDate", "supportEndDate", "isConvertedFromLead", "assignedTo", "companyId", "isActive", description, "mailingStreet", "mailingCity", "mailingState", "mailingCountry", "mailingPostalCode", "mailingPoBox", "otherStreet", "otherCity", "otherState", "otherCountry", "otherPostalCode", "otherPoBox", "accountId", "createdBy", "createdAt", "updatedAt") FROM stdin;
633de0b6-bbb2-4827-a922-34175f2a7138	\N	\N	Sajjad	Hussain	\N	\N	sajjad@gmail.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	\N	\N	f	afb943a9-ec94-4913-ad96-086f80c0bb3c	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 13:47:47.73	2026-07-30 13:47:47.73
\.


--
-- Data for Name: Currency; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Currency" (id, name, code, symbol, rate, "isDefault", "isActive", "createdAt", "updatedAt") FROM stdin;
76343f8a-1412-417a-a3d5-eaa648906c34	Euro	EUR	€	0.92000	f	t	2026-07-30 07:18:02.769	2026-07-30 07:18:02.769
4dfbe68e-6081-401f-8aad-84b45193ca88	US Dollar	USD	$	1.00000	f	t	2026-07-30 07:18:02.725	2026-07-30 12:19:55.309
d3c5e0d4-e6e8-454b-996d-14f38db804c9	Pakistani Rupee	PKR	Rs	280.00000	t	t	2026-07-30 07:18:02.764	2026-07-30 12:19:55.317
77c51f70-628a-4c13-9e76-e57e43abcfe9	Saudi Riyal	SAR	R	1.00000	f	t	2026-08-02 14:06:18.495	2026-08-02 14:06:18.495
\.


--
-- Data for Name: CurrencyInfo; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."CurrencyInfo" (id, "currencyId", "relatedId", "relatedModule", "conversionRate", "createdAt") FROM stdin;
\.


--
-- Data for Name: CustomField; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."CustomField" (id, "moduleName", label, "fieldName", type, options, "isRequired", "isActive", sequence, "companyId", "createdAt", "updatedAt") FROM stdin;
a396df66-77d3-485d-a061-b0b5b86528f2	accounts	VAT Number	cf_vat_number	text	\N	f	t	0	ec25bc6d-9e61-4edd-8949-937bf1869321	2026-08-03 11:02:44.523	2026-08-03 11:02:44.523
\.


--
-- Data for Name: CustomFieldValue; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."CustomFieldValue" (id, "moduleName", "recordId", "companyId", "values", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CustomView; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."CustomView" (id, "moduleId", name, "isDefault", "isPublic", "userId", columns, conditions, "orderBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Document" (id, "documentNo", title, "fileName", "fileType", "fileSize", "filePath", "fileLocationType", "fileDownloadCount", "fileStatus", "fileVersion", "noteContent", "folderId", "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Email; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Email" (id, "dateSent", subject, body, "fromEmail", "toEmails", "ccEmails", "bccEmails", "emailFlag", "parentId", "parentModule", attachments, "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EmailTemplate; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."EmailTemplate" (id, "templateNo", "templateName", subject, body, module, "folderName", "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Faq; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Faq" (id, "faqNo", title, description, answer, category, status, "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
5bbe972e-0537-4a2f-89cb-52d97404a43c	\N	Title	\N	\N	General	Draft	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 07:14:41.048	2026-08-03 07:14:41.048
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Holiday" (id, title, date, description, "companyId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Invoice" (id, "invoiceNo", subject, "invoiceDate", "dueDate", total, "subTotal", discount, "discountPercent", adjustment, shipping, "shippingHandling", "taxAmount", "taxType", "grandTotal", "customerNo", "purchaseOrderNo", "salesCommission", "exciseDuty", "invoiceStatus", terms, notes, description, "companyId", "isActive", "accountId", "contactId", "salesOrderId", "billingStreet", "billingCity", "billingState", "billingCountry", "billingPostalCode", "billingPoBox", "shippingStreet", "shippingCity", "shippingState", "shippingCountry", "shippingPostalCode", "shippingPoBox", "assignedTo", "createdBy", "createdAt", "updatedAt", "quoteId") FROM stdin;
b7b36ca8-54ab-46c0-8e86-8fa5398787fd	INV-1785682680080	Prod SO	2026-08-02 14:58:00.08	2026-09-01 14:58:00.08	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	50.00	0.00	Created	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	151a8a9f-aa48-4f3e-8294-9be535c39b3a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:58:00.082	2026-08-02 14:58:11.943	\N
d989e6f2-0ead-4317-8c64-a3437275d6df	INV-1785682454132	SO Flow Test	2026-08-02 14:54:14.132	2026-09-01 14:54:14.132	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	3ecc66e9-8471-49d5-bc4e-b1c1d8b5a821	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:54:14.135	2026-08-02 14:58:12.019	\N
44e27a20-2836-45cb-b956-e82cc55e15fa	INV-1785681600430	Invoice from a	2026-08-02 14:40:00.429	2026-09-01 14:40:00.429	0.00	8500.00	0.00	0.00	0.00	0.00	0.00	1280.00	Individual	9780.00	\N	\N	0.00	0.00	Created	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	60ed9ec6-137c-48a9-9963-9f44f6424829	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:40:00.431	2026-08-02 14:58:12.076	af2eddf1-6d66-4fad-ac94-1a13cf3370a6
66bd7553-7201-404f-b3f0-a64c35740e73	INV-1785679245171	Invoice from Test Quote	2026-08-02 14:00:45.171	2026-09-01 14:00:45.171	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	100.00	\N	\N	0.00	0.00	Created	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:45.182	2026-08-02 14:58:12.112	8e5a0e40-9959-4652-948a-8c34879526cb
bbd6825c-113f-4751-8bd1-c91dcb839604	INV-TEST1	Test INV	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:05:22.633	2026-08-02 15:05:38.372	\N
0764311e-2462-45a9-97e5-678f074a653a	INV-E	E	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	x	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:19:30.726	2026-08-02 15:19:30.905	\N
7d719cc5-17ea-4706-8fb8-74d0351fe8af	INV-C-1	Repro C	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:17:55.09	2026-08-02 15:19:30.957	\N
845009e0-ad6f-4232-a42d-2183693e5ab8	INV-B-1	Repro B	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:17:55.035	2026-08-02 15:19:31.04	\N
532b3d81-1f3c-4c15-b417-5c55fc6b7176	INV-A-1	Repro A	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:17:54.976	2026-08-02 15:19:31.104	\N
3fc220cc-6cda-42ad-bfdf-be09572833f5	INV-EXIST-1	Existing Invoice	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:15:01.157	2026-08-02 15:19:31.18	\N
d94054c7-b5a4-414c-8c87-332f49ba060b	INV-1785684559627	UI Invoice 1785684561169	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:29:21.3	2026-08-02 15:30:12.927	\N
0ac25a70-916a-4e2d-b86a-e157e30d9600	INV-1785684072125	UI Invoice 1785684073990	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:21:14.124	2026-08-02 15:30:12.969	\N
4c0205d8-3836-42be-8607-c52fd5607e8c	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	\N	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:24:47.202	2026-08-03 06:27:38.266	\N
c6ec6132-f997-42f7-be4d-c9aceb6273d1	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	t	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:24:25.541	2026-08-03 06:27:38.325	\N
b9df3ece-26e3-4306-ae48-b4eaac2b26b7	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	\N	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:24:15.658	2026-08-03 06:27:38.38	\N
551784b2-f31a-445f-8041-48f6f839c20c	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	t	\N	d	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:24:03.992	2026-08-03 06:27:38.429	\N
5fb5ca0b-20c9-482b-98d7-909617839a79	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	\N	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:22:58.133	2026-08-03 06:27:38.46	\N
0f924c0e-c07d-4fd0-8906-a729575ace8d	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	\N	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:26:37.019	2026-08-03 06:27:38.192	\N
809c91ec-faef-4e75-9580-ed64baa7e31e	a	a	2026-08-04 07:00:00	2026-08-05 07:00:00	0.00	100200.00	0.00	0.00	0.00	0.00	0.00	16032.00	Individual	116232.00	a	a	0.00	0.00	Sent	\N	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	fe3bd00c-e675-4d7a-82ba-ad828577e681	fe3bd00c-e675-4d7a-82ba-ad828577e681	2026-08-02 11:20:53.778	2026-08-03 06:59:51.253	\N
b1100212-f958-46f2-a793-115fb9680bd1	\N	PDF Report Test	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	0.00	0.00	Created	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	\N	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:25:17.225	2026-08-03 06:27:38.229	\N
c6eff028-7149-4de9-a140-bbc956933e1e	INV-1785750658934	INV UI Test 1785750664250	\N	\N	0.00	150.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	150.00	\N	\N	0.00	0.00	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:51:04.449	2026-08-03 09:51:07.231	\N
\.


--
-- Data for Name: InvoiceLineItem; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."InvoiceLineItem" (id, "invoiceId", "productId", "serviceId", "itemName", qty, "listPrice", "unitPrice", discount, "discountPercent", tax, "taxPercent", "netPrice", "lineTotal", sequence, description, "createdAt", "updatedAt") FROM stdin;
fcc8084f-5306-480d-b98d-6a6ca1beed1e	44e27a20-2836-45cb-b956-e82cc55e15fa	69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	50.00	10.00	200.00	0.00	20.00	1280.00	16.00	160.00	8000.00	0	ee	2026-08-02 14:40:00.485	2026-08-02 14:40:00.485
940b19c3-3d06-45dd-865f-6b7eb02a10d7	44e27a20-2836-45cb-b956-e82cc55e15fa	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	50.00	0.00	10.00	0.00	0.00	0.00	0.00	10.00	500.00	1	\N	2026-08-02 14:40:00.485	2026-08-02 14:40:00.485
140218b6-ba58-4298-b8c2-68a29e23bcbe	d989e6f2-0ead-4317-8c64-a3437275d6df	\N	\N	Laptop	1.00	0.00	1000.00	0.00	0.00	0.00	0.00	0.00	1000.00	0	\N	2026-08-02 14:54:14.173	2026-08-02 14:54:14.173
3b472447-345d-43cb-83a9-812e91a01c4a	b7b36ca8-54ab-46c0-8e86-8fa5398787fd	\N	\N	Monitor	3.00	0.00	200.00	0.00	0.00	0.00	0.00	0.00	600.00	0	\N	2026-08-02 14:58:00.089	2026-08-02 14:58:00.089
b1f05c8e-62e0-4d56-8927-be4f6c417f6e	bbd6825c-113f-4751-8bd1-c91dcb839604	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:05:22.633	2026-08-02 15:05:22.633
fea97da5-9a05-412f-85d1-e210c41735d8	0ac25a70-916a-4e2d-b86a-e157e30d9600	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:21:14.124	2026-08-02 15:21:14.124
c1578f46-8f0c-4285-9f46-337195b0f513	d94054c7-b5a4-414c-8c87-332f49ba060b	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:29:21.3	2026-08-02 15:29:21.3
d221ea4a-0261-4dd5-a70e-1391114a190b	5fb5ca0b-20c9-482b-98d7-909617839a79	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:22:58.133	2026-08-03 06:22:58.133
10286ddc-e04e-4e10-8481-d92d77ccfd2c	5fb5ca0b-20c9-482b-98d7-909617839a79	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:22:58.133	2026-08-03 06:22:58.133
d5fd1dbd-93b7-442a-a802-90e2823cb7e5	551784b2-f31a-445f-8041-48f6f839c20c	\N	\N	x	1.00	0.00	5.00	0.00	0.00	0.00	0.00	0.00	5.00	0	\N	2026-08-03 06:24:03.992	2026-08-03 06:24:03.992
1f7684a7-35e8-43aa-9d2e-0f29230e6867	b9df3ece-26e3-4306-ae48-b4eaac2b26b7	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:24:15.658	2026-08-03 06:24:15.658
7d3415c4-1dfd-4a75-876c-249d05e6355e	b9df3ece-26e3-4306-ae48-b4eaac2b26b7	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:24:15.658	2026-08-03 06:24:15.658
09fabccb-0655-40aa-98cf-48e54678120d	c6ec6132-f997-42f7-be4d-c9aceb6273d1	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions.	2026-08-03 06:24:25.541	2026-08-03 06:24:25.541
918558a6-f297-413d-a880-8c56dbf26261	4c0205d8-3836-42be-8607-c52fd5607e8c	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:24:47.202	2026-08-03 06:24:47.202
9b7a3e68-473d-4370-913e-49896b2ade71	4c0205d8-3836-42be-8607-c52fd5607e8c	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:24:47.202	2026-08-03 06:24:47.202
d8eec1ba-23e4-4ac4-bee1-1bce821bb57a	b1100212-f958-46f2-a793-115fb9680bd1	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:25:17.225	2026-08-03 06:25:17.225
68ef1605-6763-4305-812b-f4a813a6757a	b1100212-f958-46f2-a793-115fb9680bd1	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:25:17.225	2026-08-03 06:25:17.225
16f4193d-f8ec-4e39-b465-644e08b9d189	0f924c0e-c07d-4fd0-8906-a729575ace8d	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:26:37.019	2026-08-03 06:26:37.019
d7df3222-64a9-4967-9ac0-b611123c19be	0f924c0e-c07d-4fd0-8906-a729575ace8d	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:26:37.019	2026-08-03 06:26:37.019
87959e0a-005a-4634-9a5f-6a07049c9155	809c91ec-faef-4e75-9580-ed64baa7e31e	bcc60924-7178-4937-9cfd-081425e17142	\N	Fcvbcbcabric	501.00	0.00	200.00	0.00	0.00	16032.00	16.00	200.00	100200.00	0	\N	2026-08-03 06:59:51.253	2026-08-03 06:59:51.253
f29bc549-7adb-4b74-8bcc-0b5671d36601	c6eff028-7149-4de9-a140-bbc956933e1e	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-03 09:51:04.449	2026-08-03 09:51:04.449
4363d607-2aee-4fa5-86da-9d0c02f8ca4f	c6eff028-7149-4de9-a140-bbc956933e1e	\N	3aca1da6-da61-4fdb-b367-2429961fa1c9	SO-Dev-Svc	1.00	150.00	150.00	0.00	0.00	0.00	0.00	150.00	150.00	1	\N	2026-08-03 09:51:04.449	2026-08-03 09:51:04.449
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Lead" (id, "leadNo", salutation, "firstName", "lastName", title, company, email, "secondaryEmail", phone, mobile, fax, website, "leadSource", "leadStatus", industry, "annualRevenue", "noOfEmployees", rating, "emailOptOut", interest, "isConverted", "convertedAccountId", "convertedContactId", "convertedPotentialId", description, "companyId", "isActive", "assignedTo", street, city, state, country, "postalCode", "poBox", "createdBy", "campaignId", "createdAt", "updatedAt") FROM stdin;
d10afa1e-5cf6-4db9-951a-dc7d637c4bf2	\N	\N	First Lead	abc	lead title 	abc company pvt. ltd	lead@gmail.com	\N	+923121234567	+923211234567	\N	www.google.com	Cold Call	New	Apparel	500.00	50	9.5	f	98	f	\N	\N	\N	adsfasdfasdfasd	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	Lahore	Lahore	Punjab	Pakistan	54000	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	\N	2026-08-03 09:45:43.461	2026-08-03 09:45:43.461
4cb2c664-980b-4138-8365-c683c783ac4e	\N	\N	My Leads	sfsddf	a	a	aa@gmail.com	\N	\N	\N	\N	\N	Cold Call	Follow Up	\N	0.00	0	\N	f	\N	f	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	\N	2026-08-03 11:35:29.811	2026-08-03 11:35:47.028
\.


--
-- Data for Name: LoginLog; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."LoginLog" (id, "userId", email, "userName", "ipAddress", "publicIp", "userAgent", "createdAt") FROM stdin;
812d56ec-a7ae-41cb-b54d-6667a524d51f	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-30 15:09:21.858
64c08e6f-4243-4cb2-ba8a-9a9b1688c6b1	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 07:55:28.74
46f954ea-13cb-47ea-9629-7966f397787e	afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail@gmail.com	suhail	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 08:51:41.478
cb84dd6c-0c73-4ddb-a39e-241e6185f469	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 08:54:57.26
0a42908d-7bab-4a5c-99c2-236b85f3a1f3	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 08:55:02.723
52f89123-08cd-4453-b74b-6f91019bc1f3	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 08:56:24.943
f0003c79-31d6-4394-a199-9da6d2ad9777	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:10:24.965
7f2a818a-fa9f-4e80-9403-d1b919d3ccf5	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:10:40.076
3d2213e5-eccf-4e72-9b8b-d2517f5868f3	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:10:55.262
513de2e5-2150-4919-8fa6-e7acf79937d2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-30 12:07:51.322
d9daa7e7-3f62-4bcd-b008-e6464a23f33b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-30 12:12:44.47
680e2224-7cbf-4dad-95cc-a4c76d451aaa	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-30 12:21:26.783
6f9160f6-2153-45a3-88b0-9d98d60c3719	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-30 12:28:50.725
4984729e-cd7b-4544-ab77-75be194942a0	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-07-30 14:38:18.624
947b1b6e-2f32-45c5-8c3e-f0f512c65e46	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-07-30 14:38:24.538
8bf2a49d-d5e9-49f8-8d8b-a2cf87b35ad0	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 08:59:11.827
3f45fe9d-be92-403d-9cb7-f82b045a46da	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 08:59:14.039
808fdb69-566c-4d0e-81d1-87b0064db9d2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:00:59.741
e19169f6-36c1-4b79-9063-546b073767c3	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.229	39.49.150.73	curl/7.68.0	2026-08-02 09:02:17.591
fabebd3b-ca6c-4836-b3f2-93c2cfd74135	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.229	39.49.150.73	curl/7.68.0	2026-08-02 09:02:24.756
edfb9c20-3577-4e59-af56-2fc3c9af1195	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	192.168.2.25	39.49.150.73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 09:03:05.375
26a6e9b4-7140-4d4b-93dd-63261fd2a500	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:10:10.428
f3f04a59-45d9-45ac-b885-94043aa4ae86	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:11:12.13
dcc237ab-48c2-4460-9c95-bd797a903421	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:12:00.309
108d1e59-e2e8-4610-a503-ff261f14ebfd	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:12:07.069
08fd966c-0bc7-4085-86e7-fb2cb177dbfd	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:12:22.429
b0502eee-6b5e-48a7-ad73-e8ced71916f0	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:12:33.089
fd9bd41b-1e32-4055-98a7-02874b2a86ca	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:12:37.693
64ede8ee-1061-4512-9518-7ed6a1c14bb3	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:13:10.426
a4b35fe0-6124-43bd-ad3a-b02a0c896f77	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:13:10.652
9a9144bb-1e47-4172-bec1-5471f657c940	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	39.49.150.73	curl/7.68.0	2026-08-02 09:13:17.591
89c1a63c-310e-450e-bddb-5707f2f14438	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 10:42:59.119
0088f1cb-9ebf-4c9c-b648-411fda823cb9	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 10:45:08.637
2fde620e-2056-4e10-9daf-63fd2a4cab8a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 11:17:12.644
5db60f03-3600-4634-a743-cea72005a103	afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail@gmail.com	suhail	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 11:18:05.828
2a860bd1-8a73-448a-97b2-3b940e04d616	afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail@gmail.com	suhail	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 11:19:47.964
80f2cd6b-0f8c-4ca4-adca-889ea1ed9820	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 11:20:03.676
8ffc54a0-b005-4b24-b096-9bf9eaf5142f	fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad@gmail.com	sajjad	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 13:22:00.572
1eb7784b-4dde-46cc-bbfe-fdf6b8780e56	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 13:22:21.584
ca487347-a19c-418f-ab0d-f6cdb72c55e1	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 13:57:28.093
5316bae1-e0b1-48f5-8d38-b31b77535f3b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:00:37.677
8c9a4089-572d-4d87-a222-1df6ee612856	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:00:44.79
2ef99b92-f38b-4a48-bd41-c6f343166bc4	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:00:52.642
1571fafd-e462-4032-bb04-f7315a25171f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:01:00.819
4c830916-7f56-4df7-8407-3e51000aa69e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:07:28.339
e12eab31-d362-4a3b-a0f8-9ff427f9fa40	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:07:42.114
ae867661-a7dc-43d6-80d5-c2ef25452826	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:07:49.833
a6f0ecb7-d6ae-484b-ae0f-04fb51ea362b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:08:21.252
b311753c-f248-44f3-bebc-e8724f6c28a2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:08:29.718
76ba0e68-ff83-4793-9257-08bea52a0903	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:08:35.933
d1a7361b-2b03-4009-9f0c-f50c128fd894	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:10:26.743
da4d3d25-f13c-4fbe-9f11-87eff0bbb454	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:10:51.472
72f6e7b8-29a8-4dd3-b69a-9aaccd943c45	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:11:52.862
16771f3b-1d4c-4358-9674-27c88bec5103	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:14:20.311
d97bfb37-312e-46d2-a35b-a5f4678f362c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:21:07.532
85a1be2c-e3ba-4e47-8cc8-e90ab4b63977	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:22:38.626
3f56e4c2-6850-4f62-90ed-582352cb07e8	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:54:13.049
5694a566-6846-4031-83a7-643f61e1b89a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:54:21.371
594f8e4e-d526-4cef-9bed-fb2858ed2a3b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:57:59.587
6bbd24aa-144b-4a0c-a36b-2b635348915c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 14:58:11.25
fa77ace2-c831-4232-917e-7507f74b8283	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:03:03.214
9330fcd5-e3a7-4219-88e7-56adcabf4b40	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:05:22.375
53b0de11-10d8-4d72-839e-a8362011b279	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:05:38.041
a8b511e5-341c-426f-9f0a-4b1eb5480394	afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail@gmail.com	suhail	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 15:08:42.89
ffb513b9-b358-4e58-8b93-19480775786d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:10:16.541
5bfe1c14-6480-4c87-9ac5-580ffb36a5c7	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:10:50.702
c7a09903-ea73-4af0-9040-fb0ab09a9297	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:14:10.909
f828d30e-740b-4427-aacb-8bf06d206d05	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:15:00.225
66ba9461-2d1b-4fbe-b561-b45340b43e1c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:15:42.22
f698a46a-10da-4c31-ab5d-9871ffc1629c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:16:12.164
a4e93a71-2407-4534-a68a-b3fa33e09ec0	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:16:42.789
1b3e2cfc-7ed8-46e5-a0d2-5496f90a943a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:17:54.896
bcb81e46-bc6c-4f93-93db-790dd73534b2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:18:21.657
1f5923c3-9770-432e-83cb-f6665d2c37e4	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:18:41.241
d586cccf-4a67-43e1-afdc-66022998b09f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:19:30.616
f972fecc-5523-428f-a935-559ead741ac3	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:20:59.673
3a85dd99-b66c-4474-b1e7-1cf9c2ca933b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:22:23.21
7acee521-eeb0-4050-802c-0f759c759290	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:24:22.688
558033f8-6a4d-42c9-a282-27aac4b7b991	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:24:43.227
9d74149c-58ba-49ab-b36e-dcb7e76f3fc7	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:25:37.332
c55ff758-9c54-40ae-b360-d19bd6ce1e77	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-02 15:29:02.484
da6185f8-88dd-427c-97c4-d4910a279a0e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 15:29:07.398
2ff9184a-f406-4c59-afce-089ed9a5862e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:29:08.858
c9144497-87ab-4bb4-849e-22b428204f2e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:29:44.94
1c0cef19-4f0b-422a-9e14-dbca0577b0aa	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:30:12.568
27b92e51-f322-4e34-a380-2114775cef2e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-02 15:32:26.878
a70a476c-34de-4c20-979a-e15f32a410d9	afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail@gmail.com	suhail	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 06:11:37.342
967fa3b9-ac53-4c96-867a-5ab1533ac326	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:22:43.108
8d8b8e8f-5efe-40ae-84b3-c473ffd1ccd3	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:22:57.731
61422392-a457-4705-85ff-b6b058d56ef5	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:24:03.786
50de4bb3-195e-4979-968b-5f05cd189b55	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:24:15.403
f74d4d08-336e-4c60-801e-7b71a94a6123	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:24:25.378
16797efe-72dc-4428-88ec-b635df51f55d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:24:46.995
67dcda7e-4451-429f-b1aa-4c732c391a8a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:25:16.898
1ee9b305-5d0d-4e33-b6fc-1b230098d72d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:25:45.062
7e4da7ef-3ca5-4f88-a5d8-12c207858377	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:26:03.182
b23dca09-3421-4653-a955-abbd9b12158c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:26:36.848
f504070f-c76f-4233-bba7-5dd985a2f5d2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:27:37.644
adaced9c-9d70-4ccd-a19c-fbd1bad014c1	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 06:27:40.171
00e4c998-f0ca-4fde-9cae-8c6c13e45179	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:43:57.181
121aca08-7bf9-4158-b7e7-013e02880dd9	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:44:30.091
cfd42f15-1894-4397-9cbe-e0a66cffa9d7	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:45:41.035
70abd13b-3968-4b52-8784-41b2c7a86134	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:46:03.55
ae5e800a-8e57-432b-9832-dbd4ea73f442	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:46:22.524
254512c9-813a-47f5-9d2e-592e382b689f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:46:46.923
8e47ee2f-6bd2-4bc8-995f-7fcbbf3cdd96	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:47:09.803
48d0d6d1-080e-4551-87d0-a6306ea6a040	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:47:15.324
a7e26a73-7272-4ba9-b1cc-1d0e2e272666	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:47:33.126
cd6a3d91-2e81-4788-9df3-2664627b4540	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:49:25.342
18e74448-4b9a-4434-b977-b14f2b82f01a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 06:49:44.82
fb946180-1db4-4af0-b1a4-986d259bc425	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 07:12:10.24
e6e593d4-3159-49e3-a5fa-401becd7dfee	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 07:12:58.703
f75c62b7-886b-46f2-b3b9-39ad6f6ec781	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 07:13:11.818
f6eea857-48d8-4a84-a882-454a369bbd12	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 07:14:59.675
a05624ac-ccb3-4952-bfe3-8f4702e92c49	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 07:15:37.517
05539632-f96e-4599-9b39-24e60de69cdb	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 07:15:45.393
14184482-dbe9-4355-966b-3e092349dae1	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 08:52:27.816
725a7b18-92c8-4933-85d3-c735ca03f68b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 08:53:50.465
836d7419-9413-4243-8f2a-f261c75871be	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:02:15.176
f8f691ef-18df-4a3c-8a37-219db6ca0505	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:02:55.2
26862dce-c773-4265-ad31-4a5250398286	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:03:25.096
d13a2d40-c3ca-4d6f-b63a-b304a01d0df3	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:06:25.033
fafa84df-3683-43fb-9323-2e50274e866b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:07:12.11
cfd4b1e4-e19c-41a9-952b-a6828142b4d0	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:08:14.483
bca4f566-841f-4304-a4dc-e6a085e4cff9	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:08:34.629
967c5f92-797d-4974-8def-11930f0a131d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:08:55.842
4a30b76c-a82a-4177-a52b-96857f250c67	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:09:29.822
dff32711-c155-4cc5-9b2c-97a964e11f50	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.229	182.185.183.242	node	2026-08-03 09:13:34.932
733ba8b4-b327-42b7-b647-4b6f6676feb7	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:18:13.949
9c79f42a-8a89-4364-acbf-5fda4dfd028a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.229	182.185.183.242	node	2026-08-03 09:24:09.153
228de8e9-c7e2-4f88-b359-d0703b0fd467	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:50:25.668
51e23435-5b58-42ad-b52d-8d6e92870bfd	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:51:31.756
c17c7602-9da6-456c-9a7c-d2a8e399c209	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:52:33.294
9162b59a-e4d0-492f-a376-6dddd4a64813	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:53:19.928
faa34a61-ace5-46ca-8a4c-a8b23e424d31	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	node	2026-08-03 09:53:51.069
ae6ac88a-cf6c-43ec-8fed-1f3b773d825d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.229	182.185.183.242	node	2026-08-03 09:55:59.93
3e246ee0-3ce8-4840-85cf-82e82464c7e5	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 10:59:18.759
09417f41-ccc5-4c8e-acdc-b75a01f26219	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 11:02:34.645
415edab1-83fd-48d2-810c-9c89b3d40f4a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 11:02:44.273
cff0e6ec-407d-432f-8abd-77116b2bc813	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:40:43.095
6a4908e2-8a29-4216-9f12-3b0d259c4722	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:41:14.582
4f1f5139-5da6-47c3-8025-41ea85e56ce6	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 11:42:35.893
75bc3787-b431-49c3-9bc2-6615512079c2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:54:13.699
9869e2c8-b72f-4323-83ab-a14808be347c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:55:41.18
0aa7c7df-0396-42a4-b39b-51afe16f7ade	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:56:36.32
087f2fd6-2f98-4e75-b890-dfddd9754cf3	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:56:58.246
beb94945-39c0-4715-ae27-fbf9188cd55f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:57:37.789
6cd567dc-162d-468b-b0ff-59cb2fdebbca	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:58:05.264
b24739c3-567a-4556-8dd7-c1e146640f52	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 12:03:47.937
1b1cacee-81dc-4bfb-aa27-74baee5c44e6	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:06:55.856
99c59844-81b4-4d1b-9518-28bd23740df7	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:08:17.213
f9ea943c-0207-44ad-a8a0-4f5e9087068b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:13:43.316
f29e5e54-c71c-417e-92e8-66748ffe4f93	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:14:50.615
c425ee43-29cc-4f93-aa62-ca5b77f4cf7d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:15:16.525
37755777-0ee2-4138-a6f5-f422fd1cbc29	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:16:45.712
c2d5d5be-c521-4ee2-b710-c9e6bd12ba08	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:18:09.712
18af02f8-a007-4520-bb86-d82d544b3ae7	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:18:27.945
0e49844b-b710-4204-9f0d-9b0881163b86	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:18:42.581
6c48a95e-91b4-43d7-a747-414df659598e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 12:22:23.446
538911dc-0be6-419a-9d61-cd571c136c90	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:22:28.604
41924382-d704-4c3f-9756-1600b78979cb	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 12:25:19.169
a63cf440-8baf-4ec2-86df-b6f356a6b7a5	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 12:28:07.312
bf6ecc85-a672-4580-b9dc-e1dc7c60f029	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 12:53:13.502
d905fc9f-2fa8-4672-a743-7fa2b14c8a92	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:55:44.437
95e587ad-d5f6-4c06-b3aa-d0d4a07e67cd	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 12:56:00.531
b33947d8-5cba-473a-97c3-21155d75df62	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:56:25.733
e180be9d-b611-42ad-8bd8-d2e04beeab1c	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 12:57:01.543
af9564f0-0ecc-4b7e-82bf-bbf2de1f6344	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 12:58:15.334
7df09db1-ce49-4e57-ab49-b9fc8306152d	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:07:52.166
214d9e73-8b3e-4c43-9b51-530952aaeded	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:08:05.952
aa13655e-896b-410c-afcf-e203edbfbbe9	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:08:14.577
6abc7f47-442f-456f-888b-f022c9649901	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:08:26.904
69cc6f34-a5bf-4447-a85a-58f2eab1391a	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:10:25.227
7d369db1-d183-47e2-a923-3d78a6a9621b	afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail@gmail.com	suhail	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:11:26.675
3fc0c5f3-a942-4882-b1d2-68875c609af9	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:11:47.635
ca2214d8-9065-48a4-892f-1a4ac3fd35f5	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:12:05.485
e4cd060a-a059-404b-8d08-e11c442cbf65	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 13:14:35.547
dcb83442-ad95-4878-8792-3a204987546f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 13:14:36.272
f9b1368e-37de-4025-84db-22c714ea6298	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:16:01.695
59d18483-ae2c-4243-b4e8-bab2288906e6	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:16:13.395
39046af3-32b6-4dbb-ae60-9dd76ba81953	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:16:21.37
4ff4bd9d-15fe-4641-85a3-b333cb7121d2	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:16:31.087
eae5af75-76e9-4b3a-8673-f957e7a8779f	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:18:29.837
065f07d5-19c8-45d0-96d0-c2ee2d16aae6	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:18:42.447
8ac5e402-4823-4bbf-87f4-fca47ad7469e	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:18:50.396
819cd42f-2cac-478f-8435-2333978fec6b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:19:01.134
b6527bd4-3bfb-4486-b314-26bfd9686184	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:33:24.668
69480f58-a4e1-41a7-ba66-6536f65d9983	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:34:28.565
3e93bfa4-0fbc-4c3b-889a-87a13bdd8eb2	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:38:33.857
9f2e3f13-93ef-4e3b-8dc4-ca5a6805d508	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:38:50.018
b13b424c-8b0f-4615-b37d-336cd6990ed7	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:38:57.866
0d32d422-06ea-433c-bbb9-7e18374d759b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:39:14.243
85b3282e-5a52-40cc-a30d-3f2593a1cc09	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:39:41.09
0a851674-0d13-4f3f-b274-487fdc1bc078	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:39:53.443
b512dafb-a7dd-4cf2-bf68-8fadfd7c4464	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:40:01.532
5f1f428d-f5c6-4dd8-8243-69aedf67428c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:40:12.158
be1d7b45-e0e0-45b4-a927-34cac137f6b1	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:52:23.336
58323c6c-39d7-4eed-a57a-0eb73fbf55ba	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:53:33.263
553f5961-403e-42de-a206-4526e26d2dda	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:53:58.742
4db77d21-f909-4656-8c28-d6a05cf3adde	041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin@bizforce.online	superadmin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 13:54:17.009
d48cef25-cce6-433b-ba08-8e821ed49888	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	192.168.2.31	182.185.183.242	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-03 13:55:49.983
6a2737c6-e69b-46f4-b29c-9b18ca209653	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:02:02.196
a9bebe1f-3d7e-4033-b629-b94b413895ec	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:02:07.466
80df89e1-d99f-4047-90be-56cfef1bfc51	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:03:52.354
0b6fcda3-b94a-478b-ae2a-83967b87f91f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:04:02.924
7943dd58-dc5f-4ed4-a57b-d909f0e944ec	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:05:30.389
5aa70d80-1de9-4c81-aa34-0a88e0efc12d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:05:43.572
0070005a-e9cb-4c58-90fd-eaa947d6b325	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:13:56.969
3353e7ae-37ed-4634-a9e7-fc99a6af596c	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:14:12.058
808ce355-39c6-45fa-a944-ab6eb180837e	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:14:36.107
6b43c054-7cbf-4822-8812-a0b089f82ee0	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:17:17.55
30ecdd37-5ac7-46be-b598-3a68ff80a00b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:18:01.074
6196c238-974a-4c2a-a6a7-b214444ab94a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:18:10.17
72ccfcbb-ad13-460e-a33f-33e3ac554c48	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:18:28.261
c1c95609-2fb3-4363-9b59-968fd8a9517f	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:18:47.799
5b5177aa-3986-43d1-9a36-5c915ff00d5d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:33:14.132
7d324b91-0e22-4a29-827a-9c7107bae2bf	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:41:54.122
b0bd3bbb-0a98-4a76-84b9-0b6dc88e540b	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:42:07.821
79d63c43-4941-45b7-aa2d-b8bc33e76a56	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:43:22.696
ec675de8-5fd2-40ba-bbb9-c0237ba27bae	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:43:46.871
595fb84c-4b67-498f-beb6-21248b48024a	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:45:00.842
b3d46c98-8d6c-4dcf-94db-b9169c66c6df	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	::1	182.185.183.242	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 14:45:13.285
d07bc001-2bef-4996-bb42-b0438446a538	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:45:28.783
dba3f36d-ef42-4965-9b9b-3d6e30b42d9d	45c4684d-b1be-4ede-9675-8d0517609ce5	admin@bizforce.online	admin	127.0.0.1	182.185.183.242	curl/7.68.0	2026-08-03 14:45:34.047
\.


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Module" (id, name, label, parent, sequence, "isEntity", "isActive", icon, "createdAt", "updatedAt") FROM stdin;
fe072ffe-e42c-471e-a2f1-9a7fba7834c4	dashboard	Dashboard		0	f	t	LayoutDashboard	2026-07-30 07:18:02.558	2026-07-30 07:18:02.558
1aed701c-1c5d-4452-a9c6-ca271daac5a8	settings	Settings		99	f	t	Settings	2026-07-30 07:18:02.72	2026-07-30 07:18:02.72
fa0917d7-22be-433b-b6ee-93b248005c76	faq	FAQ	Support	110	t	t	HelpCircle	2026-07-30 07:18:02.674	2026-08-03 14:33:00.418
8460374a-0976-41dd-86a8-8c8472e00a2d	documents	Documents	Tools	120	t	t	File	2026-07-30 07:18:02.701	2026-08-03 14:33:00.455
15cc152f-8a10-4614-b20c-475f1f9bba29	emails	Emails	Tools	130	t	t	Mail	2026-07-30 07:18:02.712	2026-08-03 14:33:00.472
bca1fb52-769a-45fe-993b-2e7d030ed2c6	emailtemplates	Email Templates	Tools	135	t	t	FileText	2026-07-30 07:18:02.709	2026-08-03 14:33:00.486
918f3d3b-a391-4c3d-b7b5-572a604424cb	projects	Projects	Projects	140	t	t	FolderKanban	2026-07-30 07:18:02.688	2026-08-03 14:33:00.502
19b64617-c1a0-40b4-aeeb-87e5f474bb58	projecttasks	Project Tasks	Projects	145	t	t	CheckSquare	2026-07-30 07:18:02.693	2026-08-03 14:33:00.514
718b3bad-edb4-4783-ad10-455338e67bc1	projectmilestones	Project Milestones	Projects	150	t	t	Flag	2026-07-30 07:18:02.696	2026-08-03 14:33:00.569
13697696-6398-4121-828b-64cc25d4f839	assets	Assets	Support	160	t	t	HardDrive	2026-07-30 07:18:02.683	2026-08-03 14:33:00.64
943efa93-1947-4ab7-bd89-ff7fb2faf63c	servicecontracts	Service Contracts	Support	170	t	t	FileSignature	2026-07-30 07:18:02.679	2026-08-03 14:33:00.725
e8c6ccc4-b76b-464c-9042-948349a662cb	smsnotifier	SMS Notifier	Sales	175	t	t	MessageSquare	2026-07-30 07:18:02.717	2026-08-03 14:33:00.782
1d41f20d-22e2-4b9f-a7d1-83cca7073a20	currencies	Currencies		200	t	t	Banknote	2026-08-03 11:01:35.181	2026-08-03 14:33:00.797
7eddefb3-8a64-4a23-bd28-6091b32e5224	taxinfo	Tax Info		210	t	t	Percent	2026-08-03 11:01:35.214	2026-08-03 14:33:00.828
73a86ea0-be9a-4141-afc7-2175bad64b87	roles	Roles		220	t	t	Shield	2026-08-03 11:01:35.221	2026-08-03 14:33:00.948
6165c962-1da6-4c1b-a9f1-b263088f2bcb	usergroups	User Groups		230	t	t	Users	2026-08-03 11:01:35.226	2026-08-03 14:33:00.991
c6b9f73e-33c2-45b1-a2c9-5a255262566a	rolepermissions	Role Permissions		225	t	t	Shield	2026-08-03 11:01:35.232	2026-08-03 14:33:01.005
14702a1c-3af8-4a07-96ab-3e0107db1bee	accounts	Accounts	Marketing	10	t	t	Building2	2026-07-30 07:18:02.614	2026-08-03 14:32:59.986
cb42dec2-ac3b-4754-9dcd-2711d04fd09b	contacts	Contacts	Marketing	20	t	t	Users	2026-07-30 07:18:02.619	2026-08-03 14:33:00.001
026a88b4-90b1-4d8a-ad07-e7d639995d2c	leads	Leads	Marketing	30	t	t	UserPlus	2026-07-30 07:18:02.568	2026-08-03 14:33:00.031
f551d0b0-3726-4828-a2cf-45582260800d	potentials	Opportunities	Sales	40	t	t	TrendingUp	2026-07-30 07:18:02.623	2026-08-03 14:33:00.057
ad035e75-7bd2-4f24-87b6-54659c611136	campaigns	Campaigns	Marketing	5	t	t	Megaphone	2026-07-30 07:18:02.564	2026-08-03 14:33:00.11
0812f060-84c3-4b85-9f5c-fff16981d85d	products	Products	Inventory	50	t	t	Package	2026-07-30 07:18:02.643	2026-08-03 14:33:00.157
574bef99-671a-46f2-bd81-86484f23d926	services	Services	Inventory	55	t	t	Wrench	2026-07-30 07:18:02.647	2026-08-03 14:33:00.193
561b2d5b-fbf5-410d-a29b-7079a6ee347e	vendors	Vendors	Inventory	60	t	t	Truck	2026-07-30 07:18:02.657	2026-08-03 14:33:00.228
c587b4e1-ad0b-447b-8db7-325ba16ecdd6	pricebooks	Price Books	Inventory	65	t	t	BookOpen	2026-07-30 07:18:02.653	2026-08-03 14:33:00.244
3335665f-b77a-4c8c-a4b7-096e7a0574ac	quotes	Quotes	Sales	70	t	t	FileText	2026-07-30 07:18:02.629	2026-08-03 14:33:00.268
d6682b46-2747-4a56-8de5-3763c1b471ea	salesorders	Sales Orders	Sales	80	t	t	ShoppingCart	2026-07-30 07:18:02.634	2026-08-03 14:33:00.285
b183a208-cd3b-4e85-a1a8-a0c37d54c48b	purchaseorders	Purchase Orders	Inventory	85	t	t	ClipboardList	2026-07-30 07:18:02.661	2026-08-03 14:33:00.319
3c2e1b16-8798-4256-acf4-fb3df898ae7d	invoices	Invoices	Inventory	90	t	t	Receipt	2026-07-30 07:18:02.639	2026-08-03 14:33:00.355
5e31d37f-04d4-4cdf-88e7-b5246ff110c3	tickets	Tickets	Support	100	t	t	LifeBuoy	2026-07-30 07:18:02.666	2026-08-03 14:33:00.405
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Notification" (id, "userId", title, message, link, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: OrgSetting; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."OrgSetting" (id, "companyId", key, value, "createdAt", "updatedAt") FROM stdin;
d99aa740-415a-4954-8c80-8d41034e5db1	ec25bc6d-9e61-4edd-8949-937bf1869321	terms	{"quote": "QUOTE DEFAULT TERMS------", "invoice": "INVOICE DEFAULT TERMS------", "salesOrder": "SO DEFAULT TERMS------"}	2026-08-03 11:36:26.934	2026-08-03 12:23:25.021
\.


--
-- Data for Name: PermissionProfile; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."PermissionProfile" (id, name, description, "isActive", "companyId", "roleIds", permissions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PicklistOption; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."PicklistOption" (id, "moduleName", "fieldName", label, sequence, "isActive", "companyId", "createdAt", "updatedAt") FROM stdin;
c47906ca-a73a-440b-80cf-1ac6f750aa1d	leads	leadStatus	Follow Up	0	t	ec25bc6d-9e61-4edd-8949-937bf1869321	2026-08-03 11:02:44.652	2026-08-03 11:02:44.652
\.


--
-- Data for Name: Potential; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Potential" (id, "potentialNo", "potentialName", amount, "closingDate", type, stage, probability, "leadSource", "forecastAmount", "forecastCategory", "outcomeAnalysis", "nextStep", description, "companyId", "isActive", "assignedTo", "campaignId", "accountId", "contactId", "productId", "createdBy", "createdAt", "updatedAt") FROM stdin;
85703899-a693-4dcf-a248-e16b7fc173e7	\N	opportunity	10.00	2026-08-02 07:00:00	Existing Business	Prospecting	10	Cold Call	\N	Pipeline	10	10	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:06.728	2026-08-02 14:00:06.728
2fd96e15-53c9-4636-91f1-e92a6bdfd516	\N	Opportunity - 1	50.00	2026-07-30 07:00:00	Existing Business	Prospecting	1	Cold Call	\N	Pipeline	10	10	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	\N	\N	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 13:48:36.532	2026-08-02 15:09:49.093
eec4b8c3-ef31-4bc4-9c13-9be0a9762505	\N	opp - 2	200.00	2026-08-02 07:00:00	Existing Business	Prospecting	10	Existing Customer	\N	Pipeline	50	50	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	\N	\N	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-02 15:10:30.561	2026-08-02 15:10:30.561
a5441836-ac02-4681-81cd-5e09f8f966ce	\N	Widget demo opportunity	25000.00	2026-09-30 07:00:00	\N	Negotiation	\N	\N	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:17:17.751	2026-08-03 14:18:28.383
\.


--
-- Data for Name: PriceBook; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."PriceBook" (id, "priceBookNo", "priceBookName", active, "companyId", "isActive", description, "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PriceBookProduct; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."PriceBookProduct" (id, "priceBookId", "productId", "listPrice", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Product" (id, "productNo", "productName", "productCategory", "productType", manufacturer, website, "unitPrice", "costPrice", "commissionRate", "commissionPercentage", "commissionMethod", weight, "packSize", "qtyInStock", "qtyOnOrder", "qtyInDemand", "reorderLevel", "qtyPerUnit", "usageUnit", "salesStartDate", "salesEndDate", "startDate", "expiryDate", "supportStartDate", "supportEndDate", discontinued, "serialNo", "mfrPartNo", "vendorPartNo", "productSheet", "glAccount", "taxClass", description, "companyId", "isActive", image, "vendorId", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	123	fabric	Hardware		abc	10	0.00	0.00	0.00	\N	\N	10.00	10	0.00	0.00	0.00	0	\N	Set	2020-10-10 07:00:00	2026-07-30 07:00:00	2026-07-30 07:00:00	2026-07-30 07:00:00	2026-07-30 07:00:00	2026-07-30 07:00:00	f	10	10	10	10	10	10	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	10	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-07-30 08:28:23.882	2026-07-30 08:28:23.882
69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	\N		\N	\N	10.00	8.00	2.00	\N	Fixed	0.00	0	50.00	40.00	35.00	30	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	asldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfaasldfkjaksdjflasdlfa	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-07-30 08:29:12.412	2026-07-30 08:29:12.412
bcc60924-7178-4937-9cfd-081425e17142	Cotton Fabric	Fabric	Other		123	\N	0.00	0.00	0.00	\N	\N	1.00	10	0.00	0.00	0.00	0	\N	Set	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 13:51:31.229	2026-07-30 13:51:31.229
6a403f42-57c7-4ed8-8e58-820bc6af72e4	\N	a	\N		\N	\N	0.00	0.00	0.00	\N	\N	0.00	0	0.00	0.00	0.00	0	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	f	\N	\N	fe3bd00c-e675-4d7a-82ba-ad828577e681	fe3bd00c-e675-4d7a-82ba-ad828577e681	2026-08-02 11:20:19.312	2026-08-02 11:20:21.975
13e7cdfb-2ea6-4dae-93c5-d4c831c827c4	ctn-123	Cotton	Hardware		abc cotton maker	google.com	10.00	8.00	1.00	\N	Fixed	10.00	2	50.00	40.00	42.00	35	\N	Each	\N	\N	\N	\N	\N	\N	f	ctn-123	123ctn	\N	\N	\N	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 09:50:46.154	2026-08-03 09:50:46.154
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Project" (id, "projectNo", "projectName", "projectType", description, status, priority, progress, "startDate", "endDate", "actualEndDate", "targetBudget", "actualBudget", url, "companyId", "isActive", "contactId", "accountId", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
5daca719-1c39-4b24-a606-2c65ae8a05f9	\N	PROD-MS-Proj-1785741299714	\N	\N	In Progress	\N	0	\N	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 07:14:59.744	2026-08-03 07:15:38.184
e9ec688a-b04a-4baf-95e4-e90f56763216	\N	MS-Proj-1785741130585	\N	\N	In Progress	High	0	\N	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 07:12:10.629	2026-08-03 07:15:38.257
38239b0d-344e-4962-b37d-a79acfc69e5b	\N	a	Internal	xcvcvxv	In Progress	High	5	2026-07-31 07:00:00	2026-08-05 07:00:00	2026-07-28 07:00:00	10.00	2.00	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 15:08:27.161	2026-08-03 07:22:27.688
\.


--
-- Data for Name: ProjectMilestone; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."ProjectMilestone" (id, "milestoneNo", title, description, status, progress, "milestoneDate", "milestoneType", "startDate", "endDate", "companyId", "isActive", "projectId", "assignedTo", "createdBy", "createdAt", "updatedAt", "actualHours", "plannedHours", sequence) FROM stdin;
3739b326-4c01-4a2a-8258-9e3efdac97c4	1	project milestone - 1	tweteter	In Progress	10	2026-08-04 07:00:00	Internal	2026-08-03 07:00:00	2026-08-04 07:00:00	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	38239b0d-344e-4962-b37d-a79acfc69e5b	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 07:11:58.755	2026-08-03 07:12:36.244	8.00	10.00	7
849bbe03-165a-490a-bea9-f98749e73b33	\N	Milestone Alpha	\N	\N	40	2026-09-01 07:00:00	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	e9ec688a-b04a-4baf-95e4-e90f56763216	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 07:12:32.652	2026-08-03 07:15:37.742	85.00	120.00	2
abaef4b9-e7a4-42a9-aff7-20dcbb0e00cd	\N	PROD Milestone One	\N	\N	50	2026-10-01 07:00:00	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	5daca719-1c39-4b24-a606-2c65ae8a05f9	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 07:15:12.405	2026-08-03 07:15:37.911	150.00	200.00	1
\.


--
-- Data for Name: ProjectTask; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."ProjectTask" (id, "projectTaskNo", title, description, status, priority, "projectTaskType", progress, "startDate", "endDate", hours, "companyId", "isActive", "projectId", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
cbe0f692-85b0-4138-a1e3-84e7c89ca6ed	\N	Task Beta	\N	\N	\N	\N	0	\N	\N	0.00	ec25bc6d-9e61-4edd-8949-937bf1869321	f	e9ec688a-b04a-4baf-95e4-e90f56763216	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 07:12:41.586	2026-08-03 07:15:38.081
1a70e508-1220-4db1-b4e7-46cbd1d48126	\N	123	ffgdgd	In Progress	Low	Development	80	2026-08-03 07:00:00	2026-08-04 07:00:00	200.00	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	38239b0d-344e-4962-b37d-a79acfc69e5b	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 07:13:30.809	2026-08-03 07:23:16.074
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."PurchaseOrder" (id, "purchaseOrderNo", subject, "validUntil", total, "subTotal", discount, "discountPercent", adjustment, shipping, "shippingHandling", "taxAmount", "taxType", "grandTotal", carrier, "salesCommission", "exciseDuty", "poStatus", terms, description, "companyId", "isActive", "vendorId", "contactId", "billingStreet", "billingCity", "billingState", "billingCountry", "billingPostalCode", "billingPoBox", "shippingStreet", "shippingCity", "shippingState", "shippingCountry", "shippingPostalCode", "shippingPoBox", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PurchaseOrderLineItem; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."PurchaseOrderLineItem" (id, "purchaseOrderId", "productId", "serviceId", "itemName", qty, "listPrice", "unitPrice", discount, "discountPercent", tax, "taxPercent", "netPrice", "lineTotal", sequence, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Quote; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Quote" (id, "quoteNo", subject, "validUntil", total, "subTotal", discount, "discountPercent", adjustment, shipping, "shippingHandling", "taxAmount", "taxType", "grandTotal", carrier, "inventoryManager", "quoteStage", terms, description, "companyId", "isActive", "accountId", "contactId", "potentialId", "billingStreet", "billingCity", "billingState", "billingCountry", "billingPostalCode", "billingPoBox", "shippingStreet", "shippingCity", "shippingState", "shippingCountry", "shippingPostalCode", "shippingPoBox", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
76b071f9-cc0d-4fb5-a953-adc54856b2fd	2	a	2026-08-11 07:00:00	0.00	8500.00	0.00	0.00	0.00	0.00	0.00	1280.00	Individual	9780.00	1	1	Delivered	aa	aa	ec25bc6d-9e61-4edd-8949-937bf1869321	f	60ed9ec6-137c-48a9-9963-9f44f6424829	\N	85703899-a693-4dcf-a248-e16b7fc173e7	aa	aa	aa	aa	aa	aa	aa	aa	aa	aa	aa	aa	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:10:53.523	2026-08-02 14:58:12.33
af2eddf1-6d66-4fad-ac94-1a13cf3370a6	1	a	2026-08-11 07:00:00	0.00	8500.00	0.00	0.00	0.00	0.00	0.00	1280.00	Individual	9780.00	1	1	Accepted	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	60ed9ec6-137c-48a9-9963-9f44f6424829	\N	85703899-a693-4dcf-a248-e16b7fc173e7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:10:25.299	2026-08-02 14:58:12.435
8e5a0e40-9959-4652-948a-8c34879526cb	QUO-TEST-1	Test Quote	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	100.00	\N	\N	Accepted	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:37.806	2026-08-02 14:01:00.984
d72c0249-3a5c-4d10-8750-030bdf1484ff	\N	Prod OK	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	Draft	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:08:21.548	2026-08-02 14:08:36.014
a3b15a90-2b33-41eb-984c-435c7cc7b2b6	\N	Proxy Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	Draft	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:07:29.359	2026-08-02 14:08:36.128
e9a716e1-a33d-42fe-8c4f-1c3921c0ee45	QUO-9000	Table Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	Draft	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:11:53.397	2026-08-02 14:14:20.381
94719c09-dfed-4d56-9a53-6924a385f2cd	QUO-1785684565850	UI Quotation 1785684567256	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:29:27.423	2026-08-02 15:30:13.024
4e167451-1025-4eaf-b68a-cbd47d920834	QUO-1785684079635	UI Quotation 1785684081237	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:21:21.387	2026-08-02 15:30:13.059
3a4d25a5-95d5-49ad-8fba-1cb2f34f22ce	QUO-1785683823131	UI Quotation 1785683824583	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:17:04.742	2026-08-02 15:30:13.09
5b5d8ebc-2d78-423c-a806-00a56107c283	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	Draft	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:26:37.094	2026-08-03 06:27:38.543
0ff1ff8b-d77f-40cb-ab69-a749d9e1f5db	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	Draft	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:25:17.302	2026-08-03 06:27:38.572
97c8a982-717f-466c-aa47-522cc3af3999	Textyler-0001	subject of quotation	2026-08-31 07:00:00	0.00	5000.00	0.00	0.00	0.00	0.00	0.00	0.00	GST	5000.00	123	123	Delivered	xcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvz	xcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvz	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	1e262a86-2f26-4c90-95fd-d2d07b7cb729	633de0b6-bbb2-4827-a922-34175f2a7138	eec4b8c3-ef31-4bc4-9c13-9be0a9762505	Lahore	Lahore	\N	Pakistan	54000	a	Lahore	Lahore	\N	Pakistan	54000	a	fe3bd00c-e675-4d7a-82ba-ad828577e681	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 06:12:43.326	2026-08-03 06:44:57.717
619cf01b-2cfe-4e00-894e-4a0b180688e8	QUO-1785739769765	Line Items Redesign Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:49:34.355	2026-08-03 06:49:44.958
266bd5d0-0742-4054-80a8-b089f0ed3281	QUO-1785739491226	Line Items Redesign Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:44:55.296	2026-08-03 06:49:45.006
51be70b9-541b-4531-992d-dfb10bd69d31	QUO-1785748424824	PROD Style 1785748429617	\N	0.00	360.00	0.00	0.00	0.00	0.00	0.00	18.00	\N	378.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:13:50.512	2026-08-03 09:13:53.11
b1ada87d-efa0-41a5-83ad-30dcac77e7ba	QUO-1785747233641	QUO SvcTest 1785747239487	\N	0.00	175.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	175.00	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 08:54:00.442	2026-08-03 11:00:01.968
\.


--
-- Data for Name: QuoteLineItem; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."QuoteLineItem" (id, "quoteId", "productId", "serviceId", "itemName", qty, "listPrice", "unitPrice", discount, "discountPercent", tax, "taxPercent", "netPrice", "lineTotal", sequence, description, "createdAt", "updatedAt") FROM stdin;
63f4298a-dbc6-443a-a3f9-13f1a8898fe2	a3b15a90-2b33-41eb-984c-435c7cc7b2b6	\N	\N	X	1.00	0.00	10.00	0.00	0.00	0.00	0.00	0.00	10.00	0	\N	2026-08-02 14:07:29.359	2026-08-02 14:07:29.359
cab02a29-efc3-4f0e-9660-ecf6b3727681	d72c0249-3a5c-4d10-8750-030bdf1484ff	\N	\N	X	1.00	0.00	10.00	0.00	0.00	0.00	0.00	0.00	10.00	0	\N	2026-08-02 14:08:21.548	2026-08-02 14:08:21.548
649cb267-8634-4c27-ad5b-df2226ed40ba	76b071f9-cc0d-4fb5-a953-adc54856b2fd	69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	50.00	10.00	200.00	0.00	20.00	1280.00	16.00	160.00	8000.00	0	ee	2026-08-02 14:10:53.523	2026-08-02 14:10:53.523
cb69efaf-12ab-4006-8fe9-e6f67f1bb03c	76b071f9-cc0d-4fb5-a953-adc54856b2fd	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	50.00	0.00	10.00	0.00	0.00	0.00	0.00	10.00	500.00	1	\N	2026-08-02 14:10:53.523	2026-08-02 14:10:53.523
86166746-526e-47a6-af74-911ca07bb2c0	e9a716e1-a33d-42fe-8c4f-1c3921c0ee45	\N	\N	Widget	2.00	0.00	50.00	0.00	0.00	0.00	0.00	0.00	100.00	0	\N	2026-08-02 14:11:53.397	2026-08-02 14:11:53.397
66cdba73-c58d-4929-9be2-86c73e298ff2	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	50.00	10.00	200.00	0.00	20.00	1280.00	16.00	160.00	8000.00	0	ee	2026-08-02 14:36:31.894	2026-08-02 14:36:31.894
44802d2d-1509-4b05-ab6a-1cf10d172657	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	50.00	0.00	10.00	0.00	0.00	0.00	0.00	10.00	500.00	1	\N	2026-08-02 14:36:31.894	2026-08-02 14:36:31.894
188a75a7-f7a5-41e1-8fe9-aa06fbc781a2	3a4d25a5-95d5-49ad-8fba-1cb2f34f22ce	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:17:04.742	2026-08-02 15:17:04.742
ac54f0d2-8b00-4410-803f-3475f802316f	4e167451-1025-4eaf-b68a-cbd47d920834	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:21:21.387	2026-08-02 15:21:21.387
6e330a13-2681-4b27-9158-b8154cc4f09e	94719c09-dfed-4d56-9a53-6924a385f2cd	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:29:27.423	2026-08-02 15:29:27.423
0314b9ad-7eb7-49eb-a678-840aa2e28354	0ff1ff8b-d77f-40cb-ab69-a749d9e1f5db	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:25:17.302	2026-08-03 06:25:17.302
c64aaeaa-c833-40a2-bc20-3c993e0ee837	0ff1ff8b-d77f-40cb-ab69-a749d9e1f5db	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:25:17.302	2026-08-03 06:25:17.302
22d33877-c15b-4d4d-8482-516f44faf66f	5b5d8ebc-2d78-423c-a806-00a56107c283	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:26:37.094	2026-08-03 06:26:37.094
2ce26801-6de6-4b49-8aec-c2d096bc2a12	5b5d8ebc-2d78-423c-a806-00a56107c283	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:26:37.094	2026-08-03 06:26:37.094
326de9b4-82ce-41f8-b2b6-5f8b1f927693	266bd5d0-0742-4054-80a8-b089f0ed3281	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-03 06:44:55.296	2026-08-03 06:44:55.296
dc668274-98d2-43a2-914f-45671e3763c4	266bd5d0-0742-4054-80a8-b089f0ed3281	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	1	\N	2026-08-03 06:44:55.296	2026-08-03 06:44:55.296
14e9f312-64bb-4c3f-ac9a-916093c6d91b	97c8a982-717f-466c-aa47-522cc3af3999	bcc60924-7178-4937-9cfd-081425e17142	\N	Fabricss	50.00	0.00	0.00	0.00	2.00	0.00	0.00	0.00	0.00	0	this is fabric	2026-08-03 06:44:57.717	2026-08-03 06:44:57.717
f718b460-d258-4053-96b4-2f1af15606f7	97c8a982-717f-466c-aa47-522cc3af3999	bcc60924-7178-4937-9cfd-081425e17142	\N	Fabric	10.00	0.00	500.00	0.00	0.00	0.00	0.00	500.00	5000.00	1	Cotton	2026-08-03 06:44:57.717	2026-08-03 06:44:57.717
396c4fd5-110f-47ff-bbbb-0e24611a9355	619cf01b-2cfe-4e00-894e-4a0b180688e8	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-03 06:49:34.355	2026-08-03 06:49:34.355
0396849a-b2f8-4b67-8415-fd3b2485a3c8	619cf01b-2cfe-4e00-894e-4a0b180688e8	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	1	\N	2026-08-03 06:49:34.355	2026-08-03 06:49:34.355
516ff06d-d979-4461-88dc-c94a09e6305e	51be70b9-541b-4531-992d-dfb10bd69d31	\N	\N		2.00	0.00	200.00	20.00	10.00	18.00	5.00	180.00	360.00	0	\N	2026-08-03 09:13:50.512	2026-08-03 09:13:50.512
6116dadd-639c-4771-b917-540d2a98d2f0	b1ada87d-efa0-41a5-83ad-30dcac77e7ba	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-03 11:00:01.968	2026-08-03 11:00:01.968
11016087-2ab7-493f-89d4-7349831a3d4c	b1ada87d-efa0-41a5-83ad-30dcac77e7ba	\N	100d2d63-c304-44bc-bac2-a3f93c5d471c	DEV-Consulting	1.00	175.00	175.00	0.00	0.00	0.00	0.00	175.00	175.00	1	\N	2026-08-03 11:00:01.968	2026-08-03 11:00:01.968
9fe9d1e6-e504-4c9f-9180-0306e23abfde	b1ada87d-efa0-41a5-83ad-30dcac77e7ba	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2	\N	2026-08-03 11:00:01.968	2026-08-03 11:00:01.968
\.


--
-- Data for Name: QuoteStageHistory; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."QuoteStageHistory" (id, "quoteId", stage, "changedBy", "createdAt") FROM stdin;
77c29f1f-129c-444b-8c67-dafad8e3e81d	8e5a0e40-9959-4652-948a-8c34879526cb	Draft	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:37.806
22d95e81-3ec6-44c2-8e35-7a42034dcbcb	8e5a0e40-9959-4652-948a-8c34879526cb	Reviewed	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:38.366
42635769-4a90-4e13-afc5-710e2599f152	8e5a0e40-9959-4652-948a-8c34879526cb	Delivered	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:44.986
5ba2dfb7-adf7-4bb4-a907-82005e6ebe0c	8e5a0e40-9959-4652-948a-8c34879526cb	Accepted	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:45.201
895ddc12-cdef-42d2-b23b-b5a433237c61	a3b15a90-2b33-41eb-984c-435c7cc7b2b6	Draft	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:07:29.359
be86e8b6-c98d-4c8b-8ba4-33b3e6c85cbf	d72c0249-3a5c-4d10-8750-030bdf1484ff	Draft	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:08:21.548
8749d272-a5dc-4ef4-a221-31b56de44048	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:10:25.299
b80a5cc4-4a24-4ed0-a944-2bd528babb87	76b071f9-cc0d-4fb5-a953-adc54856b2fd	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:10:53.523
56dbfc56-078e-42c6-a842-a99d7e549f48	e9a716e1-a33d-42fe-8c4f-1c3921c0ee45	Draft	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:11:53.397
48f9484a-b1a8-4537-bb05-53019e9f233a	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	Reviewed	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:36:31.765
2d9d7dfc-1170-4b77-9484-dab26c6aa14b	76b071f9-cc0d-4fb5-a953-adc54856b2fd	Delivered	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:38:17.588
e1f69de9-cde4-47ef-9864-5fd4b99886e2	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	Delivered	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:39:02.128
cb8227aa-5955-4a13-bfe3-ae9e494f240f	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	Delivered	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:39:41.084
813c272a-194e-4c29-a047-0ba821dbe2f4	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	Accepted	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:40:00.66
b9a8d6c9-954e-422f-b6f8-65e55b5d4a73	3a4d25a5-95d5-49ad-8fba-1cb2f34f22ce	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:17:04.742
6eb7c6f6-13c6-47ee-a20a-4c2fa884b66b	4e167451-1025-4eaf-b68a-cbd47d920834	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:21:21.387
7933b50d-ba06-4bc0-b242-ff882cf73978	94719c09-dfed-4d56-9a53-6924a385f2cd	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:29:27.423
c1689747-de53-4947-9113-26610357bc3e	97c8a982-717f-466c-aa47-522cc3af3999	Created	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 06:12:43.326
1cb12fa8-3f5b-44a8-ab52-81b5a5316a17	97c8a982-717f-466c-aa47-522cc3af3999	Delivered	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 06:14:32.043
9295e659-7806-4d84-bd09-c83160ccd9b4	0ff1ff8b-d77f-40cb-ab69-a749d9e1f5db	Draft	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:25:17.302
b5b93138-9db6-4f61-8327-b5dc52e0a360	5b5d8ebc-2d78-423c-a806-00a56107c283	Draft	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:26:37.094
eda6be45-a24d-48db-a51e-9f8ff87b06c5	266bd5d0-0742-4054-80a8-b089f0ed3281	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:44:55.296
8e6b1779-fa80-4218-aace-69da4c398be7	619cf01b-2cfe-4e00-894e-4a0b180688e8	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:49:34.355
afe5b1a0-2acb-4639-886d-b89daacaf8d3	b1ada87d-efa0-41a5-83ad-30dcac77e7ba	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 08:54:00.442
7b1f27a9-7fce-4e85-b0b7-def3313108eb	51be70b9-541b-4531-992d-dfb10bd69d31	Created	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:13:50.512
\.


--
-- Data for Name: RelatedList; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."RelatedList" (id, "moduleName", "relatedModule", label, sequence, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Role" (id, name, description, "parentId", "companyId", "isPublic", "isActive", "createdAt", "updatedAt") FROM stdin;
cb63253e-f7cf-4cc3-af61-e829f4c336ca	CEO	Full access to all modules	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
27e502d1-72d5-48f7-bd20-9f328e40c4ea	Manager	Manager level access	cb63253e-f7cf-4cc3-af61-e829f4c336ca	ec25bc6d-9e61-4edd-8949-937bf1869321	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ccb9acf5-839d-4e40-9185-2d101b048585	User	Standard user	cb63253e-f7cf-4cc3-af61-e829f4c336ca	ec25bc6d-9e61-4edd-8949-937bf1869321	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
6d5f142b-609d-4fce-b32e-68e479db5fa6	CEO	Full access to all modules	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	t	2026-07-30 13:16:02.565	2026-07-30 13:16:02.565
c63c178c-31f2-4d89-9bee-e6eeed69176c	Manager	Manager level access	6d5f142b-609d-4fce-b32e-68e479db5fa6	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	t	2026-07-30 13:16:02.582	2026-07-30 13:16:02.582
4d7daf4a-d62e-4323-bad9-f31bcd60e275	User	Standard user	6d5f142b-609d-4fce-b32e-68e479db5fa6	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	t	2026-07-30 13:16:02.609	2026-07-30 13:16:02.609
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."RolePermission" (id, "roleId", "moduleName", view, "create", edit, delete, import, export, "createdAt", "updatedAt") FROM stdin;
65734f0c-1edb-4e60-be0b-f69b5ac41276	6d5f142b-609d-4fce-b32e-68e479db5fa6	accounts	t	t	t	t	t	t	2026-07-30 13:16:02.621	2026-07-30 13:16:02.621
c4e073cc-954c-49e6-ab40-117e2a840dde	6d5f142b-609d-4fce-b32e-68e479db5fa6	contacts	t	t	t	t	t	t	2026-07-30 13:16:02.654	2026-07-30 13:16:02.654
a3373de9-08f5-4005-b6ee-531c22de7a7c	6d5f142b-609d-4fce-b32e-68e479db5fa6	leads	t	t	t	t	t	t	2026-07-30 13:16:02.683	2026-07-30 13:16:02.683
f074538f-bee7-4561-b33e-fcf0e2a0d880	6d5f142b-609d-4fce-b32e-68e479db5fa6	potentials	t	t	t	t	t	t	2026-07-30 13:16:02.711	2026-07-30 13:16:02.711
14e97b83-f8bb-44fc-be2c-fc387164f375	6d5f142b-609d-4fce-b32e-68e479db5fa6	campaigns	t	t	t	t	t	t	2026-07-30 13:16:02.717	2026-07-30 13:16:02.717
868d4753-412f-4230-930a-df22882a3617	6d5f142b-609d-4fce-b32e-68e479db5fa6	products	t	t	t	t	t	t	2026-07-30 13:16:02.733	2026-07-30 13:16:02.733
a9e9a1f4-5d7e-4a1f-811b-1260a169b034	6d5f142b-609d-4fce-b32e-68e479db5fa6	services	t	t	t	t	t	t	2026-07-30 13:16:02.77	2026-07-30 13:16:02.77
78df900f-1b83-47e1-a11d-599fe1b770d9	6d5f142b-609d-4fce-b32e-68e479db5fa6	vendors	t	t	t	t	t	t	2026-07-30 13:16:02.782	2026-07-30 13:16:02.782
92988529-c6c8-4877-8116-828bd1c69ed9	6d5f142b-609d-4fce-b32e-68e479db5fa6	pricebooks	t	t	t	t	t	t	2026-07-30 13:16:02.79	2026-07-30 13:16:02.79
f3190637-a812-464d-8676-85ad0e81b2d7	6d5f142b-609d-4fce-b32e-68e479db5fa6	quotes	t	t	t	t	t	t	2026-07-30 13:16:02.798	2026-07-30 13:16:02.798
38db44e5-9a2d-4540-81ae-881e18b43a4b	6d5f142b-609d-4fce-b32e-68e479db5fa6	salesorders	t	t	t	t	t	t	2026-07-30 13:16:02.813	2026-07-30 13:16:02.813
a04e4b11-8a4a-46e2-a89a-7269a6c33a0b	6d5f142b-609d-4fce-b32e-68e479db5fa6	purchaseorders	t	t	t	t	t	t	2026-07-30 13:16:02.86	2026-07-30 13:16:02.86
1bf30e89-1afc-4c07-82bf-a421964e5ed1	6d5f142b-609d-4fce-b32e-68e479db5fa6	invoices	t	t	t	t	t	t	2026-07-30 13:16:02.876	2026-07-30 13:16:02.876
286bfb42-c5b1-4e7c-8ca8-f1996eeb93b9	6d5f142b-609d-4fce-b32e-68e479db5fa6	tickets	t	t	t	t	t	t	2026-07-30 13:16:02.898	2026-07-30 13:16:02.898
4535046b-6c5c-451e-86a4-090f9ec17d03	6d5f142b-609d-4fce-b32e-68e479db5fa6	faq	t	t	t	t	t	t	2026-07-30 13:16:02.909	2026-07-30 13:16:02.909
e4c51db9-9d6d-45ca-8707-0cf8497f36ba	6d5f142b-609d-4fce-b32e-68e479db5fa6	documents	t	t	t	t	t	t	2026-07-30 13:16:02.916	2026-07-30 13:16:02.916
c0c04652-cdd9-4690-8cce-fd02246491cc	6d5f142b-609d-4fce-b32e-68e479db5fa6	emails	t	t	t	t	t	t	2026-07-30 13:16:02.963	2026-07-30 13:16:02.963
cef72b12-2b3b-40e7-86af-334fe8075dd8	6d5f142b-609d-4fce-b32e-68e479db5fa6	emailtemplates	t	t	t	t	t	t	2026-07-30 13:16:02.971	2026-07-30 13:16:02.971
24b1ce0d-d965-40dc-9fbd-f98ea1406acc	6d5f142b-609d-4fce-b32e-68e479db5fa6	projects	t	t	t	t	t	t	2026-07-30 13:16:02.982	2026-07-30 13:16:02.982
b031f798-dc0c-4487-a630-db99c949ecc6	6d5f142b-609d-4fce-b32e-68e479db5fa6	projecttasks	t	t	t	t	t	t	2026-07-30 13:16:02.993	2026-07-30 13:16:02.993
6d75efbc-519a-454a-bff4-c03c3e4ccd61	6d5f142b-609d-4fce-b32e-68e479db5fa6	projectmilestones	t	t	t	t	t	t	2026-07-30 13:16:02.999	2026-07-30 13:16:02.999
608dee4c-f96c-4754-9f80-7bfc5c2bd52c	6d5f142b-609d-4fce-b32e-68e479db5fa6	assets	t	t	t	t	t	t	2026-07-30 13:16:03.01	2026-07-30 13:16:03.01
0591797b-0abf-4887-a2ca-c9fe19854177	6d5f142b-609d-4fce-b32e-68e479db5fa6	servicecontracts	t	t	t	t	t	t	2026-07-30 13:16:03.018	2026-07-30 13:16:03.018
5d249cf2-6218-471e-93a2-03d2df0fd01a	6d5f142b-609d-4fce-b32e-68e479db5fa6	smsnotifier	t	t	t	t	t	t	2026-07-30 13:16:03.037	2026-07-30 13:16:03.037
03a365a2-4ae6-423b-87b4-6cac359f75d6	4d7daf4a-d62e-4323-bad9-f31bcd60e275	accounts	t	f	f	f	f	f	2026-07-30 13:16:03.328	2026-07-30 13:16:03.328
afb2c4ab-9620-4ff8-b5a2-75a05c7dd4a2	4d7daf4a-d62e-4323-bad9-f31bcd60e275	contacts	t	f	f	f	f	f	2026-07-30 13:16:03.334	2026-07-30 13:16:03.334
222ef49d-35e0-4d92-83cf-e51d39a80504	4d7daf4a-d62e-4323-bad9-f31bcd60e275	leads	t	f	f	f	f	f	2026-07-30 13:16:03.345	2026-07-30 13:16:03.345
0ab4701b-c1cc-428e-9d4b-8f9fab5c6cfd	4d7daf4a-d62e-4323-bad9-f31bcd60e275	potentials	t	f	f	f	f	f	2026-07-30 13:16:03.377	2026-07-30 13:16:03.377
c40c513d-bf60-4b7d-9174-7effd28a2fc3	4d7daf4a-d62e-4323-bad9-f31bcd60e275	campaigns	t	f	f	f	f	f	2026-07-30 13:16:03.385	2026-07-30 13:16:03.385
4748e765-8f75-4cb3-a70a-c86dd82abd67	4d7daf4a-d62e-4323-bad9-f31bcd60e275	products	t	f	f	f	f	f	2026-07-30 13:16:03.398	2026-07-30 13:16:03.398
e231c546-641f-4c3d-a57b-7d21f407a5d9	4d7daf4a-d62e-4323-bad9-f31bcd60e275	services	t	f	f	f	f	f	2026-07-30 13:16:03.41	2026-07-30 13:16:03.41
9ce5802f-fec5-49b6-996d-31c4fea56c08	4d7daf4a-d62e-4323-bad9-f31bcd60e275	vendors	t	f	f	f	f	f	2026-07-30 13:16:03.416	2026-07-30 13:16:03.416
33e58ce1-a6e2-4925-a7ee-d3061386cf96	4d7daf4a-d62e-4323-bad9-f31bcd60e275	pricebooks	t	f	f	f	f	f	2026-07-30 13:16:03.429	2026-07-30 13:16:03.429
5eeb902d-54e6-40c2-b9c2-0382e642fe01	4d7daf4a-d62e-4323-bad9-f31bcd60e275	salesorders	t	f	f	f	f	f	2026-07-30 13:16:03.508	2026-07-30 13:16:03.508
e76ae8e4-fcfa-47d1-84cf-53db21063bdb	4d7daf4a-d62e-4323-bad9-f31bcd60e275	purchaseorders	t	f	f	f	f	f	2026-07-30 13:16:03.515	2026-07-30 13:16:03.515
859fb600-f216-40ae-b736-364c2a093967	4d7daf4a-d62e-4323-bad9-f31bcd60e275	quotes	t	f	f	f	f	f	2026-07-30 13:16:03.453	2026-07-30 13:16:03.453
d57311d4-d488-496e-9498-54fe54608d6c	4d7daf4a-d62e-4323-bad9-f31bcd60e275	invoices	t	f	f	f	f	f	2026-07-30 13:16:03.528	2026-07-30 13:16:03.528
10fa97ed-2467-4c27-8a5b-e49b5ad80955	4d7daf4a-d62e-4323-bad9-f31bcd60e275	tickets	t	f	f	f	f	f	2026-07-30 13:16:03.533	2026-07-30 13:16:03.533
281108c6-5c67-4c74-b34e-e20ab50906ed	4d7daf4a-d62e-4323-bad9-f31bcd60e275	faq	t	f	f	f	f	f	2026-07-30 13:16:03.544	2026-07-30 13:16:03.544
9a4149e0-66a0-476b-b28a-a2bbe119f827	4d7daf4a-d62e-4323-bad9-f31bcd60e275	documents	t	f	f	f	f	f	2026-07-30 13:16:03.554	2026-07-30 13:16:03.554
7a27d06f-0d12-4e9b-b07d-eed80254a59c	4d7daf4a-d62e-4323-bad9-f31bcd60e275	emails	t	f	f	f	f	f	2026-07-30 13:16:03.569	2026-07-30 13:16:03.569
7543192b-10b1-4ff1-8440-8a75c10f5c9d	4d7daf4a-d62e-4323-bad9-f31bcd60e275	emailtemplates	t	f	f	f	f	f	2026-07-30 13:16:03.584	2026-07-30 13:16:03.584
07dec4b7-043f-4c8a-ad55-87f6eb0a26e2	4d7daf4a-d62e-4323-bad9-f31bcd60e275	projects	t	f	f	f	f	f	2026-07-30 13:16:03.603	2026-07-30 13:16:03.603
e2186e39-73be-4915-a682-de8fa029e26b	4d7daf4a-d62e-4323-bad9-f31bcd60e275	projecttasks	t	f	f	f	f	f	2026-07-30 13:16:03.627	2026-07-30 13:16:03.627
7b9b932f-993e-4d85-9906-26ac02d00583	4d7daf4a-d62e-4323-bad9-f31bcd60e275	projectmilestones	t	f	f	f	f	f	2026-07-30 13:16:03.632	2026-07-30 13:16:03.632
1bb7bf1c-5c19-4cbe-8789-e0b35e589df2	4d7daf4a-d62e-4323-bad9-f31bcd60e275	assets	t	f	f	f	f	f	2026-07-30 13:16:03.647	2026-07-30 13:16:03.647
1c7ba285-8bbd-482c-8b8c-ff08dfd803a0	4d7daf4a-d62e-4323-bad9-f31bcd60e275	servicecontracts	t	f	f	f	f	f	2026-07-30 13:16:03.652	2026-07-30 13:16:03.652
2d5025ae-6476-4f12-9b98-f489536889e5	4d7daf4a-d62e-4323-bad9-f31bcd60e275	smsnotifier	t	f	f	f	f	f	2026-07-30 13:16:03.661	2026-07-30 13:16:03.661
264cc8f1-1a46-41bb-9e75-771b0427eb7f	cb63253e-f7cf-4cc3-af61-e829f4c336ca	accounts	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
4a468a8c-b763-4f56-842f-d70b8239a3e5	27e502d1-72d5-48f7-bd20-9f328e40c4ea	accounts	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
6ccf3227-3249-41a4-9274-7407ddfc98bc	ccb9acf5-839d-4e40-9185-2d101b048585	accounts	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
3fbe75be-b01c-4eea-a465-787486996723	cb63253e-f7cf-4cc3-af61-e829f4c336ca	contacts	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
1505291f-5310-474a-be07-79a1ea69efff	27e502d1-72d5-48f7-bd20-9f328e40c4ea	contacts	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
d37fc8ac-5107-42e5-b65e-7e9f492e4be3	ccb9acf5-839d-4e40-9185-2d101b048585	contacts	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
00584bc7-710a-45cd-87a2-f9f0a09c6593	cb63253e-f7cf-4cc3-af61-e829f4c336ca	leads	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
460ad7bb-113b-4e9c-9cfd-08c8169ecdba	27e502d1-72d5-48f7-bd20-9f328e40c4ea	leads	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
b9d50a7d-f9f6-4916-bf62-b94d29507bcd	ccb9acf5-839d-4e40-9185-2d101b048585	leads	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
39bea9b9-80a7-40eb-95db-bb30e75303d9	cb63253e-f7cf-4cc3-af61-e829f4c336ca	potentials	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
a8e913ce-1430-45ea-bddc-2fce94b3886e	27e502d1-72d5-48f7-bd20-9f328e40c4ea	potentials	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
39e1f6b7-08ae-4d25-9734-e23117333441	ccb9acf5-839d-4e40-9185-2d101b048585	potentials	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
3be97ef3-2c3a-453a-937d-93b6b5c12a75	cb63253e-f7cf-4cc3-af61-e829f4c336ca	campaigns	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ad2542dc-5ccc-4090-b5ac-afd5f4977934	27e502d1-72d5-48f7-bd20-9f328e40c4ea	campaigns	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
49e70b2b-98e7-4ff0-abbd-d58f819c6a52	ccb9acf5-839d-4e40-9185-2d101b048585	campaigns	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
d7b8721a-e281-4c53-bef2-37429ff01828	cb63253e-f7cf-4cc3-af61-e829f4c336ca	products	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
22e8977d-3e43-43f2-87dc-e48cdb2acf2e	27e502d1-72d5-48f7-bd20-9f328e40c4ea	products	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
3c1a2ea2-a7bb-4037-80b5-28311db83405	ccb9acf5-839d-4e40-9185-2d101b048585	products	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
d1c224ff-3bfb-4ed4-b8cf-2e98219098e4	cb63253e-f7cf-4cc3-af61-e829f4c336ca	services	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
11719711-4daf-49c7-9708-40fcfc320cbf	27e502d1-72d5-48f7-bd20-9f328e40c4ea	services	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
8bc94ce0-30b0-4642-8e8a-a8db290e57ae	ccb9acf5-839d-4e40-9185-2d101b048585	services	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
c3217ace-bba2-401a-a584-a67bdd00fa53	cb63253e-f7cf-4cc3-af61-e829f4c336ca	vendors	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
5776e28a-23e2-4097-ac45-1fed7b09d5e5	27e502d1-72d5-48f7-bd20-9f328e40c4ea	vendors	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
997395e3-4c55-4506-89f0-11d7b99b83a6	ccb9acf5-839d-4e40-9185-2d101b048585	vendors	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
569cd3a6-7184-4757-85d1-39314f8889de	cb63253e-f7cf-4cc3-af61-e829f4c336ca	pricebooks	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
28dd4dde-7e5f-40dc-811f-1c0cbd62f4e3	27e502d1-72d5-48f7-bd20-9f328e40c4ea	pricebooks	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
a6276b63-4135-43b2-993d-b391a70e2de3	ccb9acf5-839d-4e40-9185-2d101b048585	pricebooks	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
e55ae22e-189d-4d56-91c5-7815719f04ec	cb63253e-f7cf-4cc3-af61-e829f4c336ca	quotes	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
54f78a0d-5682-446b-82f2-c9e6323f4eed	27e502d1-72d5-48f7-bd20-9f328e40c4ea	quotes	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
9c258edf-d343-49e8-b18f-5831247f6b01	ccb9acf5-839d-4e40-9185-2d101b048585	quotes	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
48f4720e-ce63-47f0-8972-27c7f99fb0a5	cb63253e-f7cf-4cc3-af61-e829f4c336ca	salesorders	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
45be6964-400c-4041-ab2f-63ba2ef079b2	27e502d1-72d5-48f7-bd20-9f328e40c4ea	salesorders	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
21f4a895-2b8b-4fcb-b2d4-1dd7288fac19	ccb9acf5-839d-4e40-9185-2d101b048585	salesorders	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
040bf5fe-8df0-4f77-a062-cf0cb128c162	cb63253e-f7cf-4cc3-af61-e829f4c336ca	purchaseorders	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
6a03ec35-4227-4ab6-a878-c9449c3bfbaa	27e502d1-72d5-48f7-bd20-9f328e40c4ea	purchaseorders	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ed5cd7b5-7e47-4754-8e8f-2244a75d0473	ccb9acf5-839d-4e40-9185-2d101b048585	purchaseorders	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
bcb7a929-6199-494e-9b21-462f97679e7c	cb63253e-f7cf-4cc3-af61-e829f4c336ca	invoices	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
627d8864-b852-4ad1-8110-315d95fcd1f7	27e502d1-72d5-48f7-bd20-9f328e40c4ea	invoices	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
c5c4b4c3-d4d6-4480-9401-4e70e9bbfe7e	ccb9acf5-839d-4e40-9185-2d101b048585	invoices	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ef042b33-e691-4efc-9cf0-9cf620d14989	cb63253e-f7cf-4cc3-af61-e829f4c336ca	tickets	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
113ec331-2ead-45ac-9827-b0ee15cb366a	27e502d1-72d5-48f7-bd20-9f328e40c4ea	tickets	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
0070db9c-16de-431d-aac3-318ff3c0d674	ccb9acf5-839d-4e40-9185-2d101b048585	tickets	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
3abdb925-4aaa-4527-8015-49f9e41aa97e	cb63253e-f7cf-4cc3-af61-e829f4c336ca	faq	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
f0200670-96ef-4f92-8728-643a8deaa6b3	27e502d1-72d5-48f7-bd20-9f328e40c4ea	faq	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
820d69f9-2a83-4307-8a83-da41f231abcc	ccb9acf5-839d-4e40-9185-2d101b048585	faq	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
5c73513f-eb63-41ea-9b0d-360868409293	cb63253e-f7cf-4cc3-af61-e829f4c336ca	documents	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
98deabbb-b59a-42c8-b7e0-c0dae00c4719	27e502d1-72d5-48f7-bd20-9f328e40c4ea	documents	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
0c9cc374-c588-4b39-bd70-8b0138af403a	ccb9acf5-839d-4e40-9185-2d101b048585	documents	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
9ee9c8f6-c328-4f32-9ef1-4f1e5019b60c	cb63253e-f7cf-4cc3-af61-e829f4c336ca	emails	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
44b8872a-7c19-4776-9525-b288098bc6a7	27e502d1-72d5-48f7-bd20-9f328e40c4ea	emails	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
57a34f50-c2f7-4ddb-901a-9b3794f36ee0	ccb9acf5-839d-4e40-9185-2d101b048585	emails	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
21ad3b49-6398-4109-a57e-fb4f79f82322	cb63253e-f7cf-4cc3-af61-e829f4c336ca	emailtemplates	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ff703b42-f93f-4577-9144-c302c30f9ce4	27e502d1-72d5-48f7-bd20-9f328e40c4ea	emailtemplates	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
e6502a34-a573-4b9f-ac81-fed86ed808c7	ccb9acf5-839d-4e40-9185-2d101b048585	emailtemplates	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
2e051847-2a06-4fd7-842d-daab6f849381	cb63253e-f7cf-4cc3-af61-e829f4c336ca	projects	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
1a2e16ca-9126-4f30-9a4e-29404420abf7	27e502d1-72d5-48f7-bd20-9f328e40c4ea	projects	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
b2a12b66-bbbf-4ce8-a1f2-2edb63c25ea2	ccb9acf5-839d-4e40-9185-2d101b048585	projects	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
8a2fb3b0-3f4d-467c-a8da-7915151e12a6	cb63253e-f7cf-4cc3-af61-e829f4c336ca	projecttasks	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
928475b5-3bdd-4cee-bb6a-3532a59efc4d	27e502d1-72d5-48f7-bd20-9f328e40c4ea	projecttasks	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
a3511102-c5a3-4955-8054-ba15985ad36a	ccb9acf5-839d-4e40-9185-2d101b048585	projecttasks	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
6a4d98b7-d627-4411-9878-83108a4c8927	cb63253e-f7cf-4cc3-af61-e829f4c336ca	projectmilestones	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
aad5639c-2fd0-4592-b22a-33ec6dd4e8c1	27e502d1-72d5-48f7-bd20-9f328e40c4ea	projectmilestones	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ff1a6ccc-354b-4e28-9be4-e21de8cb88b5	ccb9acf5-839d-4e40-9185-2d101b048585	projectmilestones	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
d9317488-e9d6-4c41-8428-6a9c458f3807	cb63253e-f7cf-4cc3-af61-e829f4c336ca	assets	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
e5818b89-2a18-4655-b933-8189e21c0e11	27e502d1-72d5-48f7-bd20-9f328e40c4ea	assets	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
2464942b-981c-4228-aa7e-51b25e9e463d	ccb9acf5-839d-4e40-9185-2d101b048585	assets	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
c23f3bda-9943-499c-bc76-bce67f852b19	cb63253e-f7cf-4cc3-af61-e829f4c336ca	servicecontracts	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
0a472a9e-3ea4-4fb6-a9a5-cf355d802ada	27e502d1-72d5-48f7-bd20-9f328e40c4ea	servicecontracts	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
ce465da3-0f93-4aa1-acff-fb8104e64517	ccb9acf5-839d-4e40-9185-2d101b048585	servicecontracts	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
5197ad12-6d9d-4c23-be07-82e039298497	cb63253e-f7cf-4cc3-af61-e829f4c336ca	smsnotifier	t	t	t	t	t	t	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
dcdde3f6-81c4-4133-8e6a-7b7c1ac7b35a	27e502d1-72d5-48f7-bd20-9f328e40c4ea	smsnotifier	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
fa77dbdb-2028-4928-89e6-7d82ca552682	ccb9acf5-839d-4e40-9185-2d101b048585	smsnotifier	t	f	f	f	f	f	2026-07-30 04:58:44.66	2026-07-30 04:58:44.66
af6560aa-7bf5-460d-be22-ef4a3511d103	c63c178c-31f2-4d89-9bee-e6eeed69176c	accounts	t	f	f	f	f	f	2026-08-02 11:19:17.078	2026-08-02 11:19:17.078
759bbcdc-a52f-4cdf-89d0-eb861c5dc486	c63c178c-31f2-4d89-9bee-e6eeed69176c	contacts	t	f	f	f	f	f	2026-08-02 11:19:17.197	2026-08-02 11:19:17.197
450d8b33-9598-46e9-b8c7-b2cb953cfb6e	c63c178c-31f2-4d89-9bee-e6eeed69176c	leads	t	f	f	f	f	f	2026-08-02 11:19:17.243	2026-08-02 11:19:17.243
d4c35271-501e-448e-9b9b-c1d9b0295c1f	c63c178c-31f2-4d89-9bee-e6eeed69176c	potentials	t	f	f	f	f	f	2026-08-02 11:19:17.258	2026-08-02 11:19:17.258
5e7754d6-3679-4b3d-8e04-1c2a1d467048	c63c178c-31f2-4d89-9bee-e6eeed69176c	campaigns	t	f	f	f	f	f	2026-08-02 11:19:17.264	2026-08-02 11:19:17.264
8b60cd84-5579-48af-9e63-454082042194	c63c178c-31f2-4d89-9bee-e6eeed69176c	products	t	t	t	t	t	t	2026-08-02 11:19:17.29	2026-08-02 11:19:17.29
d09083e9-cd7d-40f4-a458-108e23bb534c	c63c178c-31f2-4d89-9bee-e6eeed69176c	services	t	f	f	f	f	f	2026-08-02 11:19:17.324	2026-08-02 11:19:17.324
0dac01a8-5d31-4fbd-a751-ef913ba3fdba	c63c178c-31f2-4d89-9bee-e6eeed69176c	vendors	t	f	f	f	f	f	2026-08-02 11:19:17.353	2026-08-02 11:19:17.353
601095f1-4b1b-4139-9ae3-dd45275c6fe4	c63c178c-31f2-4d89-9bee-e6eeed69176c	pricebooks	t	f	f	f	f	f	2026-08-02 11:19:17.359	2026-08-02 11:19:17.359
1dc27517-0a00-4c9e-952b-e3858c7e0f80	c63c178c-31f2-4d89-9bee-e6eeed69176c	quotes	t	f	f	f	f	f	2026-08-02 11:19:17.365	2026-08-02 11:19:17.365
8b9679db-0a71-48ba-bd78-26eaf2264d6b	c63c178c-31f2-4d89-9bee-e6eeed69176c	salesorders	t	f	f	f	f	f	2026-08-02 11:19:17.37	2026-08-02 11:19:17.37
4a724aa5-0692-4bf9-b616-543e5fabdd90	c63c178c-31f2-4d89-9bee-e6eeed69176c	purchaseorders	t	f	f	f	f	f	2026-08-02 11:19:17.375	2026-08-02 11:19:17.375
39ad558d-8ae2-4bf1-89bf-1a06ed3096d6	c63c178c-31f2-4d89-9bee-e6eeed69176c	invoices	t	t	t	t	t	t	2026-08-02 11:19:17.384	2026-08-02 11:19:17.384
9110e82f-36dc-4d56-b2a3-e0c76f6a98be	c63c178c-31f2-4d89-9bee-e6eeed69176c	tickets	t	f	f	f	f	f	2026-08-02 11:19:17.39	2026-08-02 11:19:17.39
7deb3bd0-ee4e-4ce8-a530-916a789b0452	c63c178c-31f2-4d89-9bee-e6eeed69176c	faq	t	f	f	f	f	f	2026-08-02 11:19:17.396	2026-08-02 11:19:17.396
d68e2330-69c4-49ae-925f-e8148b171180	c63c178c-31f2-4d89-9bee-e6eeed69176c	documents	t	f	f	f	f	f	2026-08-02 11:19:17.401	2026-08-02 11:19:17.401
b91dc94e-2f47-4d0f-b57d-38db2b87e8e4	c63c178c-31f2-4d89-9bee-e6eeed69176c	emails	t	f	f	f	f	f	2026-08-02 11:19:17.406	2026-08-02 11:19:17.406
acccb746-6c4f-4540-afca-960241bc00c4	c63c178c-31f2-4d89-9bee-e6eeed69176c	emailtemplates	t	f	f	f	f	f	2026-08-02 11:19:17.41	2026-08-02 11:19:17.41
53050a6e-5e98-48e9-b83d-8fe38f25a150	c63c178c-31f2-4d89-9bee-e6eeed69176c	projects	t	f	f	f	f	f	2026-08-02 11:19:17.416	2026-08-02 11:19:17.416
c8563d35-4508-4f64-8202-cdccb02d4ca1	c63c178c-31f2-4d89-9bee-e6eeed69176c	projecttasks	t	f	f	f	f	f	2026-08-02 11:19:17.42	2026-08-02 11:19:17.42
2652e328-c6aa-40cb-b290-d862fa9dcd07	c63c178c-31f2-4d89-9bee-e6eeed69176c	projectmilestones	t	f	f	f	f	f	2026-08-02 11:19:17.427	2026-08-02 11:19:17.427
041beb76-b87b-482a-946e-e2c1fc00bc06	c63c178c-31f2-4d89-9bee-e6eeed69176c	assets	t	f	f	f	f	f	2026-08-02 11:19:17.432	2026-08-02 11:19:17.432
3acb076d-8beb-4ccd-aa9a-377fc65be995	c63c178c-31f2-4d89-9bee-e6eeed69176c	servicecontracts	t	f	f	f	f	f	2026-08-02 11:19:17.438	2026-08-02 11:19:17.438
a84a9fa1-11cc-4b69-9f88-ce1f5b24d4dd	c63c178c-31f2-4d89-9bee-e6eeed69176c	smsnotifier	t	f	f	f	f	f	2026-08-02 11:19:17.443	2026-08-02 11:19:17.443
\.


--
-- Data for Name: SalesOrder; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."SalesOrder" (id, "salesOrderNo", subject, "validUntil", total, "subTotal", discount, "discountPercent", adjustment, shipping, "shippingHandling", "taxAmount", "taxType", "grandTotal", carrier, "soStatus", "customerNo", "purchaseOrderNo", "salesCommission", "exciseDuty", pending, "enableRecurring", terms, description, "companyId", "isActive", "accountId", "contactId", "potentialId", "quoteId", "vendorId", "billingStreet", "billingCity", "billingState", "billingCountry", "billingPostalCode", "billingPoBox", "shippingStreet", "shippingCity", "shippingState", "shippingCountry", "shippingPostalCode", "shippingPoBox", "assignedTo", "createdBy", "createdAt", "updatedAt", "endPeriod", "recurringFrequency", "startPeriod") FROM stdin;
2325feb3-382c-469f-8008-4e4edcea05cc	a	a	2026-08-07 07:00:00	44444.00	33.00	33.00	33.00	133.00	3.00	3.00	3.00	GST	33.00	a	Created	a	a	3.00	0.00	f	f	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-07-30 13:53:47.165	2026-07-30 13:53:47.165	\N	\N	\N
151a8a9f-aa48-4f3e-8294-9be535c39b3a	SO-9001	Prod SO	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	DHL	Created	\N	\N	50.00	0.00	f	t	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:57:59.747	2026-08-02 14:58:11.446	\N	Monthly	\N
3ecc66e9-8471-49d5-bc4e-b1c1d8b5a821	SO-2000	SO Flow Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	t	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:54:13.735	2026-08-02 14:58:11.518	\N	Monthly	\N
d1d26d91-c9b8-4373-9409-fe6a29007871	SO-1785681581051	a	2026-08-11 07:00:00	0.00	8500.00	0.00	0.00	0.00	0.00	0.00	1280.00	Individual	9780.00	1	Created	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	60ed9ec6-137c-48a9-9963-9f44f6424829	\N	85703899-a693-4dcf-a248-e16b7fc173e7	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:39:41.052	2026-08-02 14:58:11.573	\N	\N	\N
42644229-8ba9-4396-9499-b52791571373	SO-1785681542103	a	2026-08-11 07:00:00	0.00	8500.00	0.00	0.00	0.00	0.00	0.00	1280.00	Individual	9780.00	1	Created	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	60ed9ec6-137c-48a9-9963-9f44f6424829	\N	85703899-a693-4dcf-a248-e16b7fc173e7	af2eddf1-6d66-4fad-ac94-1a13cf3370a6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:39:02.106	2026-08-02 14:58:11.634	\N	\N	\N
2343fac5-be6b-42d3-a6cd-beabbaa04f1f	SO-1785681497436	a	2026-08-11 07:00:00	0.00	8500.00	0.00	0.00	0.00	0.00	0.00	1280.00	Individual	9780.00	1	Created	\N	\N	0.00	0.00	f	f	aa	aa	ec25bc6d-9e61-4edd-8949-937bf1869321	f	60ed9ec6-137c-48a9-9963-9f44f6424829	\N	85703899-a693-4dcf-a248-e16b7fc173e7	76b071f9-cc0d-4fb5-a953-adc54856b2fd	\N	aa	aa	aa	aa	aa	aa	aa	aa	aa	aa	aa	aa	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:38:17.437	2026-08-02 14:58:11.691	\N	\N	\N
f12fe244-d9b9-4b3b-8fdd-f668304806e8	SO-1785679244954	Test Quote	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	100.00	\N	Created	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	8e5a0e40-9959-4652-948a-8c34879526cb	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 14:00:44.956	2026-08-02 14:58:11.745	\N	\N	\N
94c6b6e9-1d3b-47c0-b5a0-55b61153614b	SO-TEST1	Test SO	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:05:22.474	2026-08-02 15:05:38.291	\N	\N	\N
c74f727e-943e-4e51-91ca-ee6c5f9bb438	SO-EXIST-1	Existing SO	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:15:01.011	2026-08-02 15:15:01.011	\N	\N	\N
71ace153-6481-4aab-991a-9cec4c849ee8	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	f	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:24:15.556	2026-08-03 06:27:38.041	\N	\N	\N
cfe50b82-3680-4aa4-a763-ddaaae81e95c	SO-1785684552781	Updated Via UI Edit	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:29:15.119	2026-08-02 15:30:12.78	\N	\N	\N
fdc40e79-fe0d-4aaf-961c-012c4c98e2d3	SO-1785684064581	Updated Via UI Edit	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-02 15:21:06.699	2026-08-02 15:30:12.829	\N	\N	\N
3a545725-5210-4c87-a388-3f51a6aaece9	SO-1785737671969	subject of quotation	2026-08-31 07:00:00	0.00	5490.00	0.00	0.00	0.00	0.00	0.00	0.00	GST	5490.00	123	Created	\N	\N	0.00	0.00	f	f	xcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvz	xcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvzxcvczxvz	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	1e262a86-2f26-4c90-95fd-d2d07b7cb729	633de0b6-bbb2-4827-a922-34175f2a7138	eec4b8c3-ef31-4bc4-9c13-9be0a9762505	97c8a982-717f-466c-aa47-522cc3af3999	\N	Lahore	Lahore	\N	Pakistan	54000	a	Lahore	Lahore	\N	Pakistan	54000	a	fe3bd00c-e675-4d7a-82ba-ad828577e681	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 06:14:31.97	2026-08-03 06:14:31.97	\N	\N	\N
f018d4cf-5e51-4faf-93c1-4a0266bc62f7	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	f	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:22:58.005	2026-08-03 06:27:38.108	\N	\N	\N
90ccf7dc-53ff-40d5-a8a6-35f204921d0f	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	f	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:26:36.937	2026-08-03 06:27:37.804	\N	\N	\N
bcb1e1e7-df93-47a9-bba0-97cb257cb96f	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	f	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:25:17.135	2026-08-03 06:27:37.911	\N	\N	\N
e2dbee1f-47e2-4c36-82b8-ede3287be008	\N	PDF Report Test	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	0.00	\N	Created	\N	\N	0.00	0.00	f	f	All prices are in USD and exclude applicable taxes. Payment terms are net 30 days from the date of invoice. Cancellation requires 60 days written notice prior to the renewal date. Custom configuration and on-site installation may be billed separately at standard rates.	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 06:24:47.087	2026-08-03 06:27:37.958	\N	\N	\N
20d57c88-0751-4e00-9679-704cf09d885f	SO-1785750648415	SO UI Test 1785750654633	\N	0.00	405.00	0.00	0.00	0.00	0.00	0.00	20.25	\N	425.25	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:50:54.874	2026-08-03 09:50:57.735	\N	\N	\N
61d252b8-55c1-40ca-8676-d1fdee2cdfb9	SO-1785750694976	SO UI T2 1785750702093	\N	0.00	705.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	705.00	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:51:42.28	2026-08-03 09:51:45.131	\N	\N	\N
25de6392-3c3a-422e-b8fa-bad9cf54e180	SO-1785750803519	PAY Test 1785750810319	\N	0.00	150.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	150.00	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:53:30.569	2026-08-03 09:53:30.569	\N	\N	\N
cd8fedb9-3dc0-46da-a4ca-d5941f2efb76	SO-1785750833546	SO FINAL 1785750838361	\N	0.00	150.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	150.00	\N	\N	\N	\N	0.00	0.00	f	f	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:53:58.565	2026-08-03 09:54:01.259	\N	\N	\N
\.


--
-- Data for Name: SalesOrderLineItem; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."SalesOrderLineItem" (id, "salesOrderId", "productId", "serviceId", "itemName", qty, "listPrice", "unitPrice", discount, "discountPercent", tax, "taxPercent", "netPrice", "lineTotal", sequence, description, "createdAt", "updatedAt") FROM stdin;
044d45f2-5813-4682-a6b5-31d3f15cc1c5	2343fac5-be6b-42d3-a6cd-beabbaa04f1f	69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	50.00	10.00	200.00	0.00	20.00	1280.00	16.00	160.00	8000.00	0	ee	2026-08-02 14:38:17.444	2026-08-02 14:38:17.444
c9c67f19-07d1-4843-89f1-d82724e00a1f	2343fac5-be6b-42d3-a6cd-beabbaa04f1f	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	50.00	0.00	10.00	0.00	0.00	0.00	0.00	10.00	500.00	1	\N	2026-08-02 14:38:17.444	2026-08-02 14:38:17.444
60f31902-b83a-4128-af1d-a37d7643c9fc	42644229-8ba9-4396-9499-b52791571373	69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	50.00	10.00	200.00	0.00	20.00	1280.00	16.00	160.00	8000.00	0	ee	2026-08-02 14:39:02.113	2026-08-02 14:39:02.113
d18b1d58-045a-4991-a6a9-c5ec0557e436	42644229-8ba9-4396-9499-b52791571373	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	50.00	0.00	10.00	0.00	0.00	0.00	0.00	10.00	500.00	1	\N	2026-08-02 14:39:02.113	2026-08-02 14:39:02.113
ebbb8a1e-6ee7-4246-8a40-8a66b4959d79	d1d26d91-c9b8-4373-9409-fe6a29007871	69d9bbc8-8126-497d-a346-86bac86c7878	\N	fabir	50.00	10.00	200.00	0.00	20.00	1280.00	16.00	160.00	8000.00	0	ee	2026-08-02 14:39:41.061	2026-08-02 14:39:41.061
8d497e28-7fac-4e39-bda2-a82f3aa56c73	d1d26d91-c9b8-4373-9409-fe6a29007871	12feda8a-a2ab-4dd1-92e6-2b49da0e8aee	\N	fabric	50.00	0.00	10.00	0.00	0.00	0.00	0.00	10.00	500.00	1	\N	2026-08-02 14:39:41.061	2026-08-02 14:39:41.061
2627eb0f-4d9c-4fd1-8004-28cd054dc630	3ecc66e9-8471-49d5-bc4e-b1c1d8b5a821	\N	\N	Laptop	1.00	0.00	1000.00	0.00	0.00	0.00	0.00	0.00	1000.00	0	\N	2026-08-02 14:54:13.735	2026-08-02 14:54:13.735
b78844e3-8cbb-4038-a3d9-97e05036039b	151a8a9f-aa48-4f3e-8294-9be535c39b3a	\N	\N	Monitor	3.00	0.00	200.00	0.00	0.00	0.00	0.00	0.00	600.00	0	\N	2026-08-02 14:57:59.747	2026-08-02 14:57:59.747
68f8f447-d343-48cb-965f-86db3ba39bb9	94c6b6e9-1d3b-47c0-b5a0-55b61153614b	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:05:22.474	2026-08-02 15:05:22.474
21d98c2a-dee0-483a-a751-325a8bef1bb8	fdc40e79-fe0d-4aaf-961c-012c4c98e2d3	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:22:31.813	2026-08-02 15:22:31.813
384cd198-fae2-49dc-bda4-d32f7c852d11	cfe50b82-3680-4aa4-a763-ddaaae81e95c	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-02 15:29:52.156	2026-08-02 15:29:52.156
b39a57d4-2beb-4958-b947-18d3e5ff5fd7	3a545725-5210-4c87-a388-3f51a6aaece9	bcc60924-7178-4937-9cfd-081425e17142	\N	Fabric	50.00	0.00	10.00	0.00	2.00	0.00	0.00	9.80	490.00	0	this is fabric	2026-08-03 06:14:31.987	2026-08-03 06:14:31.987
03f1b88a-a1a8-41dd-ab3a-b2603096a250	3a545725-5210-4c87-a388-3f51a6aaece9	bcc60924-7178-4937-9cfd-081425e17142	\N	Fabric	10.00	0.00	500.00	0.00	0.00	0.00	0.00	500.00	5000.00	1	Cotton	2026-08-03 06:14:31.987	2026-08-03 06:14:31.987
1855f96f-cfbb-45d8-9715-2b2692e4641e	f018d4cf-5e51-4faf-93c1-4a0266bc62f7	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:22:58.005	2026-08-03 06:22:58.005
55bbeae7-0cd5-43b1-b531-fd4dfe4235f7	f018d4cf-5e51-4faf-93c1-4a0266bc62f7	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:22:58.005	2026-08-03 06:22:58.005
843c19f7-5579-4ac5-b7da-23926afd047a	71ace153-6481-4aab-991a-9cec4c849ee8	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:24:15.556	2026-08-03 06:24:15.556
6e6ccaf8-64ec-4db7-9705-ba47276c15f0	71ace153-6481-4aab-991a-9cec4c849ee8	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:24:15.556	2026-08-03 06:24:15.556
74509f3b-e0a5-4e0e-9978-7ebf70c9ead6	e2dbee1f-47e2-4c36-82b8-ede3287be008	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:24:47.087	2026-08-03 06:24:47.087
4924136e-d6cc-496f-8949-63af432cce14	e2dbee1f-47e2-4c36-82b8-ede3287be008	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:24:47.087	2026-08-03 06:24:47.087
3dfb49bf-9681-4eac-a15c-3a4863355986	bcb1e1e7-df93-47a9-bba0-97cb257cb96f	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:25:17.135	2026-08-03 06:25:17.135
37edbfd1-05cf-44ee-ba66-8d246d596fbb	bcb1e1e7-df93-47a9-bba0-97cb257cb96f	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:25:17.135	2026-08-03 06:25:17.135
5d163acb-dcb9-421e-8234-7642fefb12d6	90ccf7dc-53ff-40d5-a8a6-35f204921d0f	\N	\N	Professional Enterprise Cloud Hosting and Managed Infrastructure Services - Premium Tier with 99.99% SLA and Dedicated Support Engineer	3.00	0.00	1200.50	100.00	0.00	350.15	0.00	0.00	3651.65	0	This is a very long line item description that should wrap gracefully inside the item column and must never push the table outside of its column boundaries. It contains a lot of words to simulate real-world long descriptions that sales teams paste into the system, including technical specifications, warranty details, and implementation timelines.	2026-08-03 06:26:36.937	2026-08-03 06:26:36.937
7cc93790-9cc3-4357-bcb2-58c0439a3fa2	90ccf7dc-53ff-40d5-a8a6-35f204921d0f	\N	\N	Standard Support	1.00	0.00	500.00	0.00	0.00	30.00	0.00	0.00	530.00	1	Annual support and maintenance contract	2026-08-03 06:26:36.937	2026-08-03 06:26:36.937
4e6875fe-4905-4c39-ab70-f2bbc3ef0a81	20d57c88-0751-4e00-9679-704cf09d885f	\N	\N		1.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0	\N	2026-08-03 09:50:54.874	2026-08-03 09:50:54.874
f461617e-4231-41f5-b3d7-91b5015410f6	20d57c88-0751-4e00-9679-704cf09d885f	\N	3aca1da6-da61-4fdb-b367-2429961fa1c9	SO-Dev-Svc	3.00	150.00	150.00	15.00	10.00	20.25	5.00	135.00	405.00	1	\N	2026-08-03 09:50:54.874	2026-08-03 09:50:54.874
a02af3c0-4d08-43bc-a05c-b4b80310f986	61d252b8-55c1-40ca-8676-d1fdee2cdfb9	\N	\N		3.00	0.00	150.00	15.00	10.00	0.00	0.00	135.00	405.00	0	\N	2026-08-03 09:51:42.28	2026-08-03 09:51:42.28
1d145868-ce17-4940-b822-cc565349b5da	61d252b8-55c1-40ca-8676-d1fdee2cdfb9	\N	\N	SO-Dev-Svc2	2.00	150.00	150.00	0.00	0.00	0.00	0.00	150.00	300.00	1	\N	2026-08-03 09:51:42.28	2026-08-03 09:51:42.28
3d2ea6e3-8c5c-45df-92f5-170bd96f7a97	25de6392-3c3a-422e-b8fa-bad9cf54e180	\N	9ad84495-2415-4db5-89bf-05e76ee513c6	PAY-Svc	1.00	150.00	150.00	0.00	0.00	0.00	0.00	150.00	150.00	0	\N	2026-08-03 09:53:30.569	2026-08-03 09:53:30.569
7529965e-7c69-4775-af43-34e6631f39da	cd8fedb9-3dc0-46da-a4ca-d5941f2efb76	\N	c564d895-764c-4b37-8bf0-06eda4d8210f	FINAL-Svc	1.00	150.00	150.00	0.00	0.00	0.00	0.00	150.00	150.00	0	\N	2026-08-03 09:53:58.565	2026-08-03 09:53:58.565
\.


--
-- Data for Name: ScheduledTask; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."ScheduledTask" (id, name, "moduleName", frequency, actions, "isActive", "lastRun", "nextRun", "companyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SequenceNumber; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."SequenceNumber" (id, "moduleName", prefix, suffix, "currentNo", "digitWidth", "createdAt", "updatedAt") FROM stdin;
4d901583-f88b-49e3-ae25-08c7f569134e	accounts	ACC		1	4	2026-07-30 07:18:02.772	2026-07-30 07:18:02.772
eec466b6-8f96-4ec8-9652-b26bcedb17b3	contacts	CON		1	4	2026-07-30 07:18:02.777	2026-07-30 07:18:02.777
66e87b00-9b35-47be-8b83-d00ebc47bba6	leads	LEA		1	4	2026-07-30 07:18:02.781	2026-07-30 07:18:02.781
e5e2e38c-1ebb-44a0-bc6d-9b5dccfa27a6	potentials	POT		1	4	2026-07-30 07:18:02.785	2026-07-30 07:18:02.785
c52cace5-bc5f-4d3f-8be9-990f48a984b9	invoices	INV		1	4	2026-07-30 07:18:02.789	2026-07-30 07:18:02.789
50e329ea-863d-42e8-860e-9d926fd92f86	quotes	QUO		1	4	2026-07-30 07:18:02.792	2026-07-30 07:18:02.792
0ffc5a47-b7ca-4be1-8f90-793da39a6d97	projects	PRO		1	4	2026-07-30 07:18:02.797	2026-07-30 07:18:02.797
\.


--
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Service" (id, "serviceNo", "serviceName", "serviceCategory", "unitPrice", "costPrice", "commissionRate", "commissionMethod", "qtyPerUnit", "usageUnit", "taxClass", "reorderLevel", "qtyInStock", "qtyInDemand", website, "serialNo", "glAccount", discontinued, image, description, "vendorId", "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
100d2d63-c304-44bc-bac2-a3f93c5d471c	SVC-DEV	DEV-Consulting	\N	175.00	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	\N	\N	\N	f	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 08:52:27.908	2026-08-03 08:52:27.908
995747e6-5f8a-4400-97dc-53b732c8c2a9	service-01	Test Service	Consulting	10.00	8.00	0.20	Fixed	\N	Each	\N	10	50.00	40.00	abc.com	0012	\N	f	\N	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 08:55:44.432	2026-08-03 08:57:13.122
3aca1da6-da61-4fdb-b367-2429961fa1c9	SO-SVC-1	SO-Dev-Svc	\N	150.00	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	\N	\N	\N	f	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:50:25.884	2026-08-03 09:51:10.38
8e92988b-fb5b-46c1-8a0f-5a16f19ff288	SO-SVC-2	SO-Dev-Svc2	\N	150.00	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	\N	\N	\N	f	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:51:31.943	2026-08-03 09:51:45.177
9ad84495-2415-4db5-89bf-05e76ee513c6	PAY-1	PAY-Svc	\N	150.00	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	\N	\N	\N	f	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:52:33.384	2026-08-03 09:52:33.384
c564d895-764c-4b37-8bf0-06eda4d8210f	FIN-1	FINAL-Svc	\N	150.00	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	\N	\N	\N	f	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 09:53:51.18	2026-08-03 09:54:01.334
\.


--
-- Data for Name: ServiceContract; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."ServiceContract" (id, "contractNo", "contractName", "contractType", status, priority, "startDate", "endDate", "renewalDate", "trackingUnit", "totalUnits", "usedUnits", "unitPrice", "costPrice", currency, "relatedTo", "relatedModule", description, "companyId", "isActive", "accountId", "contactId", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SharingRule; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."SharingRule" (id, "moduleName", "accessType", "roleIds", "companyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SmsNotifier; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."SmsNotifier" (id, "fromNumber", "toNumber", message, status, "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Tag" (id, name, module, "recordId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: TaxInfo; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."TaxInfo" (id, "taxName", "taxRate", "isDefault", "isActive", "createdAt", "updatedAt") FROM stdin;
50db0aae-343d-40df-8dc0-3f5350e4b7ce	GST	16.00	f	t	2026-08-02 13:56:51.292	2026-08-02 13:56:51.292
66c5a3f5-0284-4dad-86b1-59b97a590af0	Income Tax	10.00	f	t	2026-08-02 13:57:08.831	2026-08-02 13:57:08.831
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Ticket" (id, "ticketNo", title, description, solution, "updateLog", status, priority, severity, category, hours, days, "fromMail", "versionId", "companyId", "isActive", "contactId", "accountId", "productId", "serviceContractId", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
87f11324-c5dc-4dc2-b01f-e7206b66ac5f	\N	new ticket title	sfasd	fsadfasdf	sdfasdfasd	Open	Low	Major	\N	0.00	2	\N	\N	6d7b961f-d42f-4a58-9738-af85339d1e2b	t	\N	\N	\N	\N	afb943a9-ec94-4913-ad96-086f80c0bb3c	afb943a9-ec94-4913-ad96-086f80c0bb3c	2026-08-03 07:14:13.306	2026-08-03 07:14:20.053
64d1fc9c-91f8-408e-8439-b9ce84dae242	\N	Open ticket from dashboard demo	\N	\N	\N	Open	High	\N	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:17:17.669	2026-08-03 14:18:28.33
d7234cd9-bcff-4db9-967e-68442d34597a	\N	Widget test open ticket	\N	\N	\N	Open	High	\N	\N	\N	\N	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	f	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:14:12.138	2026-08-03 14:18:28.459
d603482d-f572-4754-8ad9-40f9deecfdcd	\N	new ticket	\N	\N	\N	Open	High	Critical	General	10.00	2	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:31:09.679	2026-08-03 14:31:09.679
98ead80c-c085-4fd8-b543-79a6e881da86	\N	Ticket for CRM deployment	\N	\N	\N	Open	Urgent	Feature	General	50.00	10	\N	\N	ec25bc6d-9e61-4edd-8949-937bf1869321	t	\N	\N	\N	\N	45c4684d-b1be-4ede-9675-8d0517609ce5	45c4684d-b1be-4ede-9675-8d0517609ce5	2026-08-03 14:31:40.117	2026-08-03 14:31:40.117
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."User" (id, "userName", email, "firstName", "lastName", password, phone, mobile, title, department, "addressStreet", "addressCity", "addressState", "addressCountry", "addressPostalCode", timezone, language, avatar, "isActive", "isAdmin", "lastLogin", "resetToken", "resetTokenExpires", "roleId", "companyId", "createdAt", "updatedAt", "currencyCode", "dateFormat", "defaultModule", "failedLoginAttempts", "hourFormat", "lockedUntil", "startOfWeek", "twoFactorEnabled", "twoFactorSecret") FROM stdin;
fe3bd00c-e675-4d7a-82ba-ad828577e681	sajjad	sajjad@gmail.com	Sajjad	Hussain	$2a$10$PDxjTpFAywvFRFoWUCnHE.iM0Zgj.Cdf844yKPGHCqWq/lfLj/4gq	\N	\N	\N	\N	\N	\N	\N	\N	\N	Asia/Karachi	en_us	\N	t	f	2026-08-02 13:22:00.522	\N	\N	c63c178c-31f2-4d89-9bee-e6eeed69176c	6d7b961f-d42f-4a58-9738-af85339d1e2b	2026-08-02 08:52:54.001	2026-08-02 13:22:00.523	\N	\N	\N	0	\N	\N	\N	f	\N
afb943a9-ec94-4913-ad96-086f80c0bb3c	suhail	suhail@gmail.com	suhail	rao	$2a$10$WhXvVpdMZSpvUjRzdMul2eMZ5iRoZpomiJIWnIJ/amt2mSOVaK6fi	\N	\N	\N	\N	\N	\N	\N	\N	\N	Asia/Karachi	en_us	\N	t	t	2026-08-03 13:11:26.664	\N	\N	6d5f142b-609d-4fce-b32e-68e479db5fa6	6d7b961f-d42f-4a58-9738-af85339d1e2b	2026-07-30 13:16:04.211	2026-08-03 13:11:26.665	\N	\N	\N	0	\N	\N	\N	f	\N
45c4684d-b1be-4ede-9675-8d0517609ce5	admin	admin@bizforce.online	Admin	User	$2a$10$vEAsHCZ9BlyeP9QcIoyb.u2/5pIbr07ANc/a1/BQSYJuqVJ.t6Gna	\N	\N	\N	\N	\N	\N	\N	\N	\N	Asia/Karachi	en_us	/uploads/1785400303603-u85naf.png	t	t	2026-08-03 14:45:34.039	\N	\N	cb63253e-f7cf-4cc3-af61-e829f4c336ca	ec25bc6d-9e61-4edd-8949-937bf1869321	2026-07-30 07:18:02.551	2026-08-03 14:45:34.04	\N	\N	\N	0	\N	\N	\N	f	HNRF5YCM4C7ZH73LJFDK
041fb45b-8f4e-430e-90fc-1059ecb8baa8	superadmin	superadmin@bizforce.online	Super	Admin	$2b$04$bhMb3heI8gvv7XAhB2yFwOv7PXyWP80yMt9joM41O1CKkflSj.Dw.	\N	\N	\N	\N	\N	\N	\N	\N	\N	UTC	en_us	\N	t	t	2026-08-03 13:54:17.001	\N	\N	\N	\N	2026-07-30 06:39:27.854	2026-08-03 13:54:17.002	\N	\N	\N	0	\N	\N	\N	f	\N
\.


--
-- Data for Name: UserGroup; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."UserGroup" (id, name, description, "companyId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserGroupMember; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."UserGroupMember" (id, "groupId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: UserProfile; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."UserProfile" (id, "userId", "isSuperAdmin", permissions, "createdAt", "updatedAt") FROM stdin;
f648c394-80c5-4c07-818a-a8257789c05e	45c4684d-b1be-4ede-9675-8d0517609ce5	f	{}	2026-07-30 04:21:22.498	2026-07-30 04:21:22.498
01ea1a8b-fd44-4bf6-a5b2-f0b55455829d	041fb45b-8f4e-430e-90fc-1059ecb8baa8	t	{}	2026-07-30 06:39:27.915	2026-07-30 06:39:27.915
\.


--
-- Data for Name: Vendor; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Vendor" (id, "vendorNo", "vendorName", email, phone, mobile, website, category, "glAccount", street, city, state, country, "postalCode", description, "companyId", "isActive", "assignedTo", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Webform; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Webform" (id, name, "moduleName", fields, "successMessage", "redirectUrl", "isActive", token, "companyId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Workflow; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public."Workflow" (id, name, "moduleName", "triggerType", conditions, actions, "isActive", "companyId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: crm
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0b8218fe-8408-4582-a3bd-a6afa66f1c64	83887059b16311eff6653cab39ed8a6fc49e56448f9a7e406ad5e8d3807bd230	2026-07-07 07:48:55.215605-04	20260706121441_init	\N	\N	2026-07-07 07:48:53.687581-04	1
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Attachment Attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Campaign Campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Campaign"
    ADD CONSTRAINT "Campaign_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: CurrencyInfo CurrencyInfo_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."CurrencyInfo"
    ADD CONSTRAINT "CurrencyInfo_pkey" PRIMARY KEY (id);


--
-- Name: Currency Currency_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Currency"
    ADD CONSTRAINT "Currency_pkey" PRIMARY KEY (id);


--
-- Name: CustomFieldValue CustomFieldValue_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."CustomFieldValue"
    ADD CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY (id);


--
-- Name: CustomField CustomField_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."CustomField"
    ADD CONSTRAINT "CustomField_pkey" PRIMARY KEY (id);


--
-- Name: CustomView CustomView_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."CustomView"
    ADD CONSTRAINT "CustomView_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmailTemplate EmailTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Email Email_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Email"
    ADD CONSTRAINT "Email_pkey" PRIMARY KEY (id);


--
-- Name: Faq Faq_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Faq"
    ADD CONSTRAINT "Faq_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceLineItem InvoiceLineItem_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."InvoiceLineItem"
    ADD CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: LoginLog LoginLog_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."LoginLog"
    ADD CONSTRAINT "LoginLog_pkey" PRIMARY KEY (id);


--
-- Name: Module Module_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Module"
    ADD CONSTRAINT "Module_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrgSetting OrgSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."OrgSetting"
    ADD CONSTRAINT "OrgSetting_pkey" PRIMARY KEY (id);


--
-- Name: PermissionProfile PermissionProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PermissionProfile"
    ADD CONSTRAINT "PermissionProfile_pkey" PRIMARY KEY (id);


--
-- Name: PicklistOption PicklistOption_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PicklistOption"
    ADD CONSTRAINT "PicklistOption_pkey" PRIMARY KEY (id);


--
-- Name: Potential Potential_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Potential"
    ADD CONSTRAINT "Potential_pkey" PRIMARY KEY (id);


--
-- Name: PriceBookProduct PriceBookProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PriceBookProduct"
    ADD CONSTRAINT "PriceBookProduct_pkey" PRIMARY KEY (id);


--
-- Name: PriceBook PriceBook_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PriceBook"
    ADD CONSTRAINT "PriceBook_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ProjectMilestone ProjectMilestone_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."ProjectMilestone"
    ADD CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY (id);


--
-- Name: ProjectTask ProjectTask_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."ProjectTask"
    ADD CONSTRAINT "ProjectTask_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrderLineItem PurchaseOrderLineItem_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PurchaseOrderLineItem"
    ADD CONSTRAINT "PurchaseOrderLineItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: QuoteLineItem QuoteLineItem_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."QuoteLineItem"
    ADD CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY (id);


--
-- Name: QuoteStageHistory QuoteStageHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."QuoteStageHistory"
    ADD CONSTRAINT "QuoteStageHistory_pkey" PRIMARY KEY (id);


--
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- Name: RelatedList RelatedList_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."RelatedList"
    ADD CONSTRAINT "RelatedList_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SalesOrderLineItem SalesOrderLineItem_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."SalesOrderLineItem"
    ADD CONSTRAINT "SalesOrderLineItem_pkey" PRIMARY KEY (id);


--
-- Name: SalesOrder SalesOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."SalesOrder"
    ADD CONSTRAINT "SalesOrder_pkey" PRIMARY KEY (id);


--
-- Name: ScheduledTask ScheduledTask_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."ScheduledTask"
    ADD CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY (id);


--
-- Name: SequenceNumber SequenceNumber_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."SequenceNumber"
    ADD CONSTRAINT "SequenceNumber_pkey" PRIMARY KEY (id);


--
-- Name: ServiceContract ServiceContract_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."ServiceContract"
    ADD CONSTRAINT "ServiceContract_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: SharingRule SharingRule_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."SharingRule"
    ADD CONSTRAINT "SharingRule_pkey" PRIMARY KEY (id);


--
-- Name: SmsNotifier SmsNotifier_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."SmsNotifier"
    ADD CONSTRAINT "SmsNotifier_pkey" PRIMARY KEY (id);


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (id);


--
-- Name: TaxInfo TaxInfo_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."TaxInfo"
    ADD CONSTRAINT "TaxInfo_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: UserGroupMember UserGroupMember_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."UserGroupMember"
    ADD CONSTRAINT "UserGroupMember_pkey" PRIMARY KEY (id);


--
-- Name: UserGroup UserGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."UserGroup"
    ADD CONSTRAINT "UserGroup_pkey" PRIMARY KEY (id);


--
-- Name: UserProfile UserProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vendor Vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY (id);


--
-- Name: Webform Webform_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Webform"
    ADD CONSTRAINT "Webform_pkey" PRIMARY KEY (id);


--
-- Name: Workflow Workflow_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Workflow"
    ADD CONSTRAINT "Workflow_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_accountNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Account_accountNo_key" ON public."Account" USING btree ("accountNo");


--
-- Name: Activity_companyId_idx; Type: INDEX; Schema: public; Owner: crm
--

CREATE INDEX "Activity_companyId_idx" ON public."Activity" USING btree ("companyId");


--
-- Name: Activity_dueAt_idx; Type: INDEX; Schema: public; Owner: crm
--

CREATE INDEX "Activity_dueAt_idx" ON public."Activity" USING btree ("dueAt");


--
-- Name: Activity_startAt_idx; Type: INDEX; Schema: public; Owner: crm
--

CREATE INDEX "Activity_startAt_idx" ON public."Activity" USING btree ("startAt");


--
-- Name: Asset_assetNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Asset_assetNo_key" ON public."Asset" USING btree ("assetNo");


--
-- Name: Campaign_campaignNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Campaign_campaignNo_key" ON public."Campaign" USING btree ("campaignNo");


--
-- Name: Contact_contactNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Contact_contactNo_key" ON public."Contact" USING btree ("contactNo");


--
-- Name: CurrencyInfo_currencyId_relatedId_relatedModule_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "CurrencyInfo_currencyId_relatedId_relatedModule_key" ON public."CurrencyInfo" USING btree ("currencyId", "relatedId", "relatedModule");


--
-- Name: Currency_code_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Currency_code_key" ON public."Currency" USING btree (code);


--
-- Name: CustomFieldValue_moduleName_recordId_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "CustomFieldValue_moduleName_recordId_key" ON public."CustomFieldValue" USING btree ("moduleName", "recordId");


--
-- Name: CustomField_companyId_moduleName_fieldName_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "CustomField_companyId_moduleName_fieldName_key" ON public."CustomField" USING btree ("companyId", "moduleName", "fieldName");


--
-- Name: Document_documentNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Document_documentNo_key" ON public."Document" USING btree ("documentNo");


--
-- Name: EmailTemplate_templateNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "EmailTemplate_templateNo_key" ON public."EmailTemplate" USING btree ("templateNo");


--
-- Name: Faq_faqNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Faq_faqNo_key" ON public."Faq" USING btree ("faqNo");


--
-- Name: Invoice_invoiceNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON public."Invoice" USING btree ("invoiceNo");


--
-- Name: Lead_leadNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Lead_leadNo_key" ON public."Lead" USING btree ("leadNo");


--
-- Name: Module_name_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Module_name_key" ON public."Module" USING btree (name);


--
-- Name: OrgSetting_companyId_key_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "OrgSetting_companyId_key_key" ON public."OrgSetting" USING btree ("companyId", key);


--
-- Name: PicklistOption_companyId_moduleName_fieldName_label_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "PicklistOption_companyId_moduleName_fieldName_label_key" ON public."PicklistOption" USING btree ("companyId", "moduleName", "fieldName", label);


--
-- Name: Potential_potentialNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Potential_potentialNo_key" ON public."Potential" USING btree ("potentialNo");


--
-- Name: PriceBookProduct_priceBookId_productId_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "PriceBookProduct_priceBookId_productId_key" ON public."PriceBookProduct" USING btree ("priceBookId", "productId");


--
-- Name: PriceBook_priceBookNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "PriceBook_priceBookNo_key" ON public."PriceBook" USING btree ("priceBookNo");


--
-- Name: Product_productNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Product_productNo_key" ON public."Product" USING btree ("productNo");


--
-- Name: ProjectMilestone_milestoneNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "ProjectMilestone_milestoneNo_key" ON public."ProjectMilestone" USING btree ("milestoneNo");


--
-- Name: ProjectTask_projectTaskNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "ProjectTask_projectTaskNo_key" ON public."ProjectTask" USING btree ("projectTaskNo");


--
-- Name: Project_projectNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Project_projectNo_key" ON public."Project" USING btree ("projectNo");


--
-- Name: PurchaseOrder_purchaseOrderNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "PurchaseOrder_purchaseOrderNo_key" ON public."PurchaseOrder" USING btree ("purchaseOrderNo");


--
-- Name: Quote_quoteNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Quote_quoteNo_key" ON public."Quote" USING btree ("quoteNo");


--
-- Name: RelatedList_moduleName_relatedModule_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "RelatedList_moduleName_relatedModule_key" ON public."RelatedList" USING btree ("moduleName", "relatedModule");


--
-- Name: RolePermission_roleId_moduleName_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "RolePermission_roleId_moduleName_key" ON public."RolePermission" USING btree ("roleId", "moduleName");


--
-- Name: Role_name_companyId_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Role_name_companyId_key" ON public."Role" USING btree (name, "companyId");


--
-- Name: SalesOrder_salesOrderNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "SalesOrder_salesOrderNo_key" ON public."SalesOrder" USING btree ("salesOrderNo");


--
-- Name: SequenceNumber_moduleName_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "SequenceNumber_moduleName_key" ON public."SequenceNumber" USING btree ("moduleName");


--
-- Name: ServiceContract_contractNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "ServiceContract_contractNo_key" ON public."ServiceContract" USING btree ("contractNo");


--
-- Name: Service_serviceNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Service_serviceNo_key" ON public."Service" USING btree ("serviceNo");


--
-- Name: SharingRule_companyId_moduleName_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "SharingRule_companyId_moduleName_key" ON public."SharingRule" USING btree ("companyId", "moduleName");


--
-- Name: Ticket_ticketNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Ticket_ticketNo_key" ON public."Ticket" USING btree ("ticketNo");


--
-- Name: UserGroupMember_groupId_userId_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "UserGroupMember_groupId_userId_key" ON public."UserGroupMember" USING btree ("groupId", "userId");


--
-- Name: UserProfile_userId_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "UserProfile_userId_key" ON public."UserProfile" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_resetToken_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "User_resetToken_key" ON public."User" USING btree ("resetToken");


--
-- Name: User_userName_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "User_userName_key" ON public."User" USING btree ("userName");


--
-- Name: Vendor_vendorNo_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Vendor_vendorNo_key" ON public."Vendor" USING btree ("vendorNo");


--
-- Name: Webform_token_key; Type: INDEX; Schema: public; Owner: crm
--

CREATE UNIQUE INDEX "Webform_token_key" ON public."Webform" USING btree (token);


--
-- Name: Asset Asset_serviceContractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES public."ServiceContract"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CustomView CustomView_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."CustomView"
    ADD CONSTRAINT "CustomView_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."Module"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceLineItem InvoiceLineItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."InvoiceLineItem"
    ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_salesOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES public."SalesOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LoginLog LoginLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."LoginLog"
    ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PriceBookProduct PriceBookProduct_priceBookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PriceBookProduct"
    ADD CONSTRAINT "PriceBookProduct_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES public."PriceBook"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PriceBookProduct PriceBookProduct_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PriceBookProduct"
    ADD CONSTRAINT "PriceBookProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectMilestone ProjectMilestone_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."ProjectMilestone"
    ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectTask ProjectTask_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."ProjectTask"
    ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderLineItem PurchaseOrderLineItem_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."PurchaseOrderLineItem"
    ADD CONSTRAINT "PurchaseOrderLineItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuoteLineItem QuoteLineItem_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."QuoteLineItem"
    ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuoteStageHistory QuoteStageHistory_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."QuoteStageHistory"
    ADD CONSTRAINT "QuoteStageHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalesOrderLineItem SalesOrderLineItem_salesOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."SalesOrderLineItem"
    ADD CONSTRAINT "SalesOrderLineItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES public."SalesOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_serviceContractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES public."ServiceContract"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserGroupMember UserGroupMember_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."UserGroupMember"
    ADD CONSTRAINT "UserGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."UserGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserGroupMember UserGroupMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."UserGroupMember"
    ADD CONSTRAINT "UserGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserProfile UserProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: crm
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO crm;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO crm;


--
-- PostgreSQL database dump complete
--

