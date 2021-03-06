# MIT License
# Copyright (c) 2014 Chris McCord
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software
# and associated documentation files (the "Software"), to deal in the Software without
# restriction, including without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom
# the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or
# substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
# PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
# ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
# ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

defmodule AdminAPI.WebSocket do
  @moduledoc """
  Heavily inspired by https://hexdocs.pm/phoenix/Phoenix.Transports.WebSocket.html

  Socket transport for websocket clients.
  """

  @behaviour Phoenix.Socket.Transport

  def default_config do
    [timeout: 60_000, transport_log: false]
  end

  ## Callbacks

  import Plug.Conn, only: [fetch_query_params: 1, send_resp: 3]
  import EWallet.Web.WebSocket, only: [init: 5, update_headers: 1, get_endpoint: 4]

  require Logger

  alias AdminAPI.V1.ErrorHandler
  alias Phoenix.Transports.WebSocket

  @doc false
  def init(%Plug.Conn{method: "GET"} = conn, opts) do
    with conn <- fetch_query_params(conn),
         params <- update_headers(conn),
         headers when not is_nil(headers) <- params["headers"],
         accept when not is_nil(accept) <- headers["accept"],
         {:ok, endpoint, serializer} <-
           get_endpoint(
             conn,
             accept,
             :admin_api,
             &ErrorHandler.handle_error/2
           ),
         {:ok, _conn, {_module, {_socket, _opts}}} = res <-
           init(conn, opts, endpoint, serializer, params) do
      res
    else
      _error ->
        conn = send_resp(conn, 403, "")
        {:error, conn}
    end
  end

  @doc false
  defdelegate ws_init(attrs), to: WebSocket
  defdelegate ws_handle(opcode, payload, state), to: WebSocket
  defdelegate ws_info(attrs, state), to: WebSocket
  defdelegate ws_terminate(reason, state), to: WebSocket
  defdelegate ws_close(state), to: WebSocket

  defdelegate code_reload(conn, opts, endpoint), to: EWallet.Web.WebSocket
end
