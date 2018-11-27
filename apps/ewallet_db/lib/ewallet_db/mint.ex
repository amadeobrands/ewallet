defmodule EWalletDB.Mint do
  @moduledoc """
  Ecto Schema representing mints.
  """
  use Ecto.Schema
  use EWalletConfig.Types.ExternalID
  use EWalletDB.Auditable
  import Ecto.{Query, Changeset}
  import EWalletDB.Helpers.Preloader
  alias Ecto.UUID
  alias EWalletDB.{Account, Audit, Mint, Repo, Token, Transaction}
  alias EWalletConfig.Types.VirtualStruct

  @primary_key {:uuid, Ecto.UUID, autogenerate: true}

  schema "mint" do
    external_id(prefix: "mnt_")

    field(:description, :string)
    field(:amount, EWalletConfig.Types.Integer)
    field(:confirmed, :boolean, default: false)
    field(:originator, VirtualStruct, virtual: true)

    belongs_to(
      :token,
      Token,
      foreign_key: :token_uuid,
      references: :uuid,
      type: UUID
    )

    belongs_to(
      :account,
      Account,
      foreign_key: :account_uuid,
      references: :uuid,
      type: UUID
    )

    belongs_to(
      :transaction,
      Transaction,
      foreign_key: :transaction_uuid,
      references: :uuid,
      type: UUID
    )

    timestamps()
  end

  defp changeset(%Mint{} = mint, attrs) do
    mint
    |> cast_and_validate_required_for_audit(
      attrs,
      [
        :description,
        :amount,
        :account_uuid,
        :token_uuid,
        :confirmed
      ],
      [:amount, :token_uuid, :originator]
    )
    |> validate_number(
      :amount,
      greater_than: 0,
      less_than: 100_000_000_000_000_000_000_000_000_000_000_000
    )
    |> assoc_constraint(:token)
    |> assoc_constraint(:account)
    |> assoc_constraint(:transaction)
    |> foreign_key_constraint(:token_uuid)
    |> foreign_key_constraint(:account_uuid)
    |> foreign_key_constraint(:transaction_uuid)
  end

  defp update_changeset(%Mint{} = mint, attrs) do
    mint
    |> cast_and_validate_required_for_audit(
      attrs,
      [:transaction_uuid],
      [:transaction_uuid]
    )
    |> assoc_constraint(:transaction)
  end

  def query_by_token(token, query \\ Mint) do
    from(m in query, where: m.token_uuid == ^token.uuid)
  end

  def total_supply_for_token(token) do
    Mint
    |> where([m], m.token_uuid == ^token.uuid)
    |> select([m], sum(m.amount))
    |> Repo.one()
    |> EWalletConfig.Types.Integer.load!()
  end

  @doc """
  Retrieve a mint by id.
  """
  @spec get_by(String.t(), opts :: keyword()) :: %Mint{} | nil
  def get(id, opts \\ [])
  def get(nil, _), do: nil

  def get(id, opts) do
    get_by([id: id], opts)
  end

  @doc """
  Retrieves a mint using one or more fields.
  """
  @spec get_by(fields :: map() | keyword(), opts :: keyword()) :: %Mint{} | nil
  def get_by(fields, opts \\ []) do
    Mint
    |> Repo.get_by(fields)
    |> preload_option(opts)
  end

  @doc """
  Create a new mint with the passed attributes.
  """
  def insert(attrs) do
    %Mint{}
    |> changeset(attrs)
    |> Audit.insert_record_with_audit()
  end

  @doc """
  Updates a mint with the provided attributes.
  """
  @spec update(mint :: %Mint{}, attrs :: map()) :: {:ok, %Mint{}} | {:error, Ecto.Changeset.t()}
  def update(%Mint{} = mint, attrs) do
    mint
    |> update_changeset(attrs)
    |> Audit.update_record_with_audit()
  end

  @doc """
  Confirms a mint.
  """
  def confirm(%Mint{confirmed: true} = mint, _), do: mint

  def confirm(%Mint{confirmed: false} = mint, originator) do
    {:ok, mint} =
      mint
      |> changeset(%{
        confirmed: true,
        originator: originator
      })
      |> Audit.update_record_with_audit()

    mint
  end
end
