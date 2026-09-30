export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          organization_id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          organization_id: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          organization_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          billing_city: string;
          billing_line1: string;
          billing_line2: string | null;
          billing_pincode: string | null;
          billing_state_code: string;
          code: string | null;
          contact_person: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          gstin: string | null;
          id: string;
          name: string;
          notes: string | null;
          organization_id: string;
          phone: string | null;
          shipping_city: string | null;
          shipping_line1: string | null;
          shipping_line2: string | null;
          shipping_pincode: string | null;
          shipping_same_as_billing: boolean;
          shipping_state_code: string | null;
          status: Database["public"]["Enums"]["record_status"];
          updated_at: string;
        };
        Insert: {
          billing_city: string;
          billing_line1: string;
          billing_line2?: string | null;
          billing_pincode?: string | null;
          billing_state_code: string;
          code?: string | null;
          contact_person?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          organization_id: string;
          phone?: string | null;
          shipping_city?: string | null;
          shipping_line1?: string | null;
          shipping_line2?: string | null;
          shipping_pincode?: string | null;
          shipping_same_as_billing?: boolean;
          shipping_state_code?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          updated_at?: string;
        };
        Update: {
          billing_city?: string;
          billing_line1?: string;
          billing_line2?: string | null;
          billing_pincode?: string | null;
          billing_state_code?: string;
          code?: string | null;
          contact_person?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          gstin?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          organization_id?: string;
          phone?: string | null;
          shipping_city?: string | null;
          shipping_line1?: string | null;
          shipping_line2?: string | null;
          shipping_pincode?: string | null;
          shipping_same_as_billing?: boolean;
          shipping_state_code?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      document_sequences: {
        Row: {
          document_type: string;
          last_value: number;
          organization_id: string;
          year: number;
        };
        Insert: {
          document_type: string;
          last_value?: number;
          organization_id: string;
          year: number;
        };
        Update: {
          document_type?: string;
          last_value?: number;
          organization_id?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_sequences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          created_at: string;
          created_by: string | null;
          due_date: string;
          id: string;
          invoice_date: string;
          invoice_number: string;
          order_id: string;
          organization_id: string;
          paid_at: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          due_date: string;
          id?: string;
          invoice_date: string;
          invoice_number: string;
          order_id: string;
          organization_id: string;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          due_date?: string;
          id?: string;
          invoice_date?: string;
          invoice_number?: string;
          order_id?: string;
          organization_id?: string;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_order_id_fkey";
            columns: ["organization_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "order_list";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "invoices_organization_id_order_id_fkey";
            columns: ["organization_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      order_charges: {
        Row: {
          amount: number;
          cgst: number;
          id: string;
          igst: number;
          label: string;
          order_id: string;
          organization_id: string;
          position: number;
          sgst: number;
          tax_amount: number;
          tax_rate: number | null;
          total: number;
        };
        Insert: {
          amount: number;
          cgst: number;
          id?: string;
          igst: number;
          label: string;
          order_id: string;
          organization_id: string;
          position: number;
          sgst: number;
          tax_amount: number;
          tax_rate?: number | null;
          total: number;
        };
        Update: {
          amount?: number;
          cgst?: number;
          id?: string;
          igst?: number;
          label?: string;
          order_id?: string;
          organization_id?: string;
          position?: number;
          sgst?: number;
          tax_amount?: number;
          tax_rate?: number | null;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_charges_organization_id_order_id_fkey";
            columns: ["organization_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "order_list";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "order_charges_organization_id_order_id_fkey";
            columns: ["organization_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      order_items: {
        Row: {
          cgst: number;
          discount_percent: number | null;
          gross_amount: number;
          hsn_code: string | null;
          id: string;
          igst: number;
          line_discount: number;
          line_total: number;
          name: string;
          order_discount_share: number;
          order_id: string;
          organization_id: string;
          position: number;
          quantity: number;
          rate: number;
          sgst: number;
          tax_amount: number;
          tax_rate: number;
          taxable_amount: number;
          unit: string;
        };
        Insert: {
          cgst: number;
          discount_percent?: number | null;
          gross_amount: number;
          hsn_code?: string | null;
          id?: string;
          igst: number;
          line_discount: number;
          line_total: number;
          name: string;
          order_discount_share: number;
          order_id: string;
          organization_id: string;
          position: number;
          quantity: number;
          rate: number;
          sgst: number;
          tax_amount: number;
          tax_rate: number;
          taxable_amount: number;
          unit: string;
        };
        Update: {
          cgst?: number;
          discount_percent?: number | null;
          gross_amount?: number;
          hsn_code?: string | null;
          id?: string;
          igst?: number;
          line_discount?: number;
          line_total?: number;
          name?: string;
          order_discount_share?: number;
          order_id?: string;
          organization_id?: string;
          position?: number;
          quantity?: number;
          rate?: number;
          sgst?: number;
          tax_amount?: number;
          tax_rate?: number;
          taxable_amount?: number;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_organization_id_order_id_fkey";
            columns: ["organization_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "order_list";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "order_items_organization_id_order_id_fkey";
            columns: ["organization_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      orders: {
        Row: {
          billing_address: NonNullable<Json>;
          cancelled_at: string | null;
          cgst_total: number;
          charge_total: number;
          confirmed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_email: string | null;
          customer_gstin: string | null;
          customer_id: string;
          customer_name: string;
          customer_phone: string | null;
          discount_total: number;
          grand_total: number;
          id: string;
          igst_total: number;
          line_discount_total: number;
          notes: string | null;
          order_date: string;
          order_discount_total: number;
          order_discount_type: string;
          order_discount_value: number | null;
          order_number: string;
          organization_id: string;
          place_of_supply: string;
          prices_include_tax: boolean;
          rounding_adjustment: number;
          sgst_total: number;
          share_token: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          supply_type: string;
          tax_summary: NonNullable<Json>;
          tax_total: number;
          taxable_amount: number;
          updated_at: string;
        };
        Insert: {
          billing_address: NonNullable<Json>;
          cancelled_at?: string | null;
          cgst_total: number;
          charge_total: number;
          confirmed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_email?: string | null;
          customer_gstin?: string | null;
          customer_id: string;
          customer_name: string;
          customer_phone?: string | null;
          discount_total: number;
          grand_total: number;
          id?: string;
          igst_total: number;
          line_discount_total: number;
          notes?: string | null;
          order_date: string;
          order_discount_total: number;
          order_discount_type?: string;
          order_discount_value?: number | null;
          order_number: string;
          organization_id: string;
          place_of_supply: string;
          prices_include_tax: boolean;
          rounding_adjustment: number;
          sgst_total: number;
          share_token?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          supply_type: string;
          tax_summary?: NonNullable<Json>;
          tax_total: number;
          taxable_amount: number;
          updated_at?: string;
        };
        Update: {
          billing_address?: NonNullable<Json>;
          cancelled_at?: string | null;
          cgst_total?: number;
          charge_total?: number;
          confirmed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_email?: string | null;
          customer_gstin?: string | null;
          customer_id?: string;
          customer_name?: string;
          customer_phone?: string | null;
          discount_total?: number;
          grand_total?: number;
          id?: string;
          igst_total?: number;
          line_discount_total?: number;
          notes?: string | null;
          order_date?: string;
          order_discount_total?: number;
          order_discount_type?: string;
          order_discount_value?: number | null;
          order_number?: string;
          organization_id?: string;
          place_of_supply?: string;
          prices_include_tax?: boolean;
          rounding_adjustment?: number;
          sgst_total?: number;
          share_token?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          supply_type?: string;
          tax_summary?: NonNullable<Json>;
          tax_total?: number;
          taxable_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_customer_id_fkey";
            columns: ["organization_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_summaries";
            referencedColumns: ["organization_id", "customer_id"];
          },
          {
            foreignKeyName: "orders_organization_id_customer_id_fkey";
            columns: ["organization_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          status?: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          organization_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          country: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          default_tax_rate: number;
          email: string | null;
          gst_enabled: boolean;
          gstin: string | null;
          id: string;
          invoice_prefix: string;
          legal_name: string | null;
          logo_path: string | null;
          name: string;
          order_prefix: string;
          pan: string | null;
          phone: string | null;
          pincode: string | null;
          prices_include_tax: boolean;
          round_grand_total: boolean;
          rounding_mode: string;
          state_code: string | null;
          tax_rounding: string;
          timezone: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          default_tax_rate?: number;
          email?: string | null;
          gst_enabled?: boolean;
          gstin?: string | null;
          id?: string;
          invoice_prefix?: string;
          legal_name?: string | null;
          logo_path?: string | null;
          name: string;
          order_prefix?: string;
          pan?: string | null;
          phone?: string | null;
          pincode?: string | null;
          prices_include_tax?: boolean;
          round_grand_total?: boolean;
          rounding_mode?: string;
          state_code?: string | null;
          tax_rounding?: string;
          timezone?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          default_tax_rate?: number;
          email?: string | null;
          gst_enabled?: boolean;
          gstin?: string | null;
          id?: string;
          invoice_prefix?: string;
          legal_name?: string | null;
          logo_path?: string | null;
          name?: string;
          order_prefix?: string;
          pan?: string | null;
          phone?: string | null;
          pincode?: string | null;
          prices_include_tax?: boolean;
          round_grand_total?: boolean;
          rounding_mode?: string;
          state_code?: string | null;
          tax_rounding?: string;
          timezone?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          permission?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      customer_summaries: {
        Row: {
          customer_id: string | null;
          invoiced_count: number | null;
          last_order_date: string | null;
          order_count: number | null;
          organization_id: string | null;
          outstanding: number | null;
          revenue: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      order_list: {
        Row: {
          created_at: string | null;
          customer_gstin: string | null;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          due_date: string | null;
          grand_total: number | null;
          id: string | null;
          invoice_date: string | null;
          invoice_number: string | null;
          invoice_status: Database["public"]["Enums"]["invoice_status"] | null;
          item_count: number | null;
          item_names: string | null;
          order_date: string | null;
          order_number: string | null;
          organization_id: string | null;
          payment_state: string | null;
          status: Database["public"]["Enums"]["order_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_customer_id_fkey";
            columns: ["organization_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_summaries";
            referencedColumns: ["organization_id", "customer_id"];
          },
          {
            foreignKeyName: "orders_organization_id_customer_id_fkey";
            columns: ["organization_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_invitation: {
        Args: { p_invitation_id: string };
        Returns: {
          created_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "organization_members";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cancel_order: {
        Args: { p_order_id: string };
        Returns: {
          billing_address: NonNullable<Json>;
          cancelled_at: string | null;
          cgst_total: number;
          charge_total: number;
          confirmed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_email: string | null;
          customer_gstin: string | null;
          customer_id: string;
          customer_name: string;
          customer_phone: string | null;
          discount_total: number;
          grand_total: number;
          id: string;
          igst_total: number;
          line_discount_total: number;
          notes: string | null;
          order_date: string;
          order_discount_total: number;
          order_discount_type: string;
          order_discount_value: number | null;
          order_number: string;
          organization_id: string;
          place_of_supply: string;
          prices_include_tax: boolean;
          rounding_adjustment: number;
          sgst_total: number;
          share_token: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          supply_type: string;
          tax_summary: NonNullable<Json>;
          tax_total: number;
          taxable_amount: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      confirm_order: {
        Args: { p_order_id: string };
        Returns: {
          billing_address: NonNullable<Json>;
          cancelled_at: string | null;
          cgst_total: number;
          charge_total: number;
          confirmed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_email: string | null;
          customer_gstin: string | null;
          customer_id: string;
          customer_name: string;
          customer_phone: string | null;
          discount_total: number;
          grand_total: number;
          id: string;
          igst_total: number;
          line_discount_total: number;
          notes: string | null;
          order_date: string;
          order_discount_total: number;
          order_discount_type: string;
          order_discount_value: number | null;
          order_number: string;
          organization_id: string;
          place_of_supply: string;
          prices_include_tax: boolean;
          rounding_adjustment: number;
          sgst_total: number;
          share_token: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          supply_type: string;
          tax_summary: NonNullable<Json>;
          tax_total: number;
          taxable_amount: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_organization: {
        Args: { p_gstin?: string; p_legal_name?: string; p_name: string; p_state_code?: string };
        Returns: {
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          country: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          default_tax_rate: number;
          email: string | null;
          gst_enabled: boolean;
          gstin: string | null;
          id: string;
          invoice_prefix: string;
          legal_name: string | null;
          logo_path: string | null;
          name: string;
          order_prefix: string;
          pan: string | null;
          phone: string | null;
          pincode: string | null;
          prices_include_tax: boolean;
          round_grand_total: boolean;
          rounding_mode: string;
          state_code: string | null;
          tax_rounding: string;
          timezone: string;
          updated_at: string;
          website: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "organizations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      generate_invoice: {
        Args: { p_due_days?: number; p_order_id: string };
        Returns: {
          created_at: string;
          created_by: string | null;
          due_date: string;
          id: string;
          invoice_date: string;
          invoice_number: string;
          order_id: string;
          organization_id: string;
          paid_at: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "invoices";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      invite_member: {
        Args: {
          p_email: string;
          p_organization_id: string;
          p_role: Database["public"]["Enums"]["app_role"];
        };
        Returns: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "organization_invitations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      my_permissions: { Args: { p_organization_id: string }; Returns: string[] };
      remove_member: { Args: { p_organization_id: string; p_user_id: string }; Returns: undefined };
      revoke_invitation: { Args: { p_invitation_id: string }; Returns: undefined };
      save_order: {
        Args: {
          p_actor_id: string;
          p_charges: Json;
          p_confirm: boolean;
          p_items: Json;
          p_order: Json;
          p_order_id: string;
          p_organization_id: string;
        };
        Returns: {
          billing_address: NonNullable<Json>;
          cancelled_at: string | null;
          cgst_total: number;
          charge_total: number;
          confirmed_at: string | null;
          created_at: string;
          created_by: string | null;
          customer_email: string | null;
          customer_gstin: string | null;
          customer_id: string;
          customer_name: string;
          customer_phone: string | null;
          discount_total: number;
          grand_total: number;
          id: string;
          igst_total: number;
          line_discount_total: number;
          notes: string | null;
          order_date: string;
          order_discount_total: number;
          order_discount_type: string;
          order_discount_value: number | null;
          order_number: string;
          organization_id: string;
          place_of_supply: string;
          prices_include_tax: boolean;
          rounding_adjustment: number;
          sgst_total: number;
          share_token: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          supply_type: string;
          tax_summary: NonNullable<Json>;
          tax_total: number;
          taxable_amount: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_invoice_paid: {
        Args: { p_order_id: string; p_paid: boolean };
        Returns: {
          created_at: string;
          created_by: string | null;
          due_date: string;
          id: string;
          invoice_date: string;
          invoice_number: string;
          order_id: string;
          organization_id: string;
          paid_at: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "invoices";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      update_member_role: {
        Args: {
          p_organization_id: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_user_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          invited_by: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "organization_members";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "manager" | "sales" | "viewer";
      invoice_status: "ISSUED" | "PAID" | "CANCELLED";
      order_status: "DRAFT" | "CONFIRMED" | "CANCELLED";
      record_status: "ACTIVE" | "ARCHIVED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "admin", "manager", "sales", "viewer"],
      invoice_status: ["ISSUED", "PAID", "CANCELLED"],
      order_status: ["DRAFT", "CONFIRMED", "CANCELLED"],
      record_status: ["ACTIVE", "ARCHIVED"],
    },
  },
} as const;
