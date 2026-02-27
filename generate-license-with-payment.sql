-- Função para gerar licença e debitar do saldo
-- Esta função deve ser chamada pela API de licenças após gerar a licença com sucesso

CREATE OR REPLACE FUNCTION debit_license_payment(
  p_user_id UUID,
  p_amount DECIMAL,
  p_plan_name TEXT,
  p_license_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Verificar saldo atual
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock para evitar race condition

  -- Verificar se tem saldo suficiente
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: R$ %, necessário: R$ %', v_current_balance, p_amount;
  END IF;

  -- Calcular novo saldo
  v_new_balance := v_current_balance - p_amount;

  -- Atualizar saldo
  UPDATE wallets
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Registrar transação
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    status,
    description,
    created_at
  ) VALUES (
    p_user_id,
    'debit',
    p_amount,
    'completed',
    'Compra de licença ' || p_plan_name || ' - Chave: ' || p_license_key,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_debited', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao processar pagamento: %', SQLERRM;
END;
$$;

-- Garantir que apenas usuários autenticados podem chamar
REVOKE ALL ON FUNCTION debit_license_payment FROM PUBLIC;
GRANT EXECUTE ON FUNCTION debit_license_payment TO authenticated;
