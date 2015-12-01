
module Pulp.Shell where

import Prelude
import Data.Maybe (Maybe(..))
import Control.Monad.Eff.Class (liftEff)
import Node.Encoding (Encoding(UTF8))
import Node.Buffer as Buffer
import Node.FS.Aff as FS

import Pulp.Exec
import Pulp.System.FFI
import Pulp.System.Files (openTemp)
import Pulp.System.Log as Log

shell :: forall e. String -> AffN e Unit
shell cmd = do
  Log.log $ "Executing " ++ cmd
  cmdBuf <- liftEff $ Buffer.fromString cmd UTF8
  info <- openTemp { prefix: "pulp-cmd-", suffix: ".sh" }
  FS.fdAppend info.fd cmdBuf
  FS.fdClose info.fd
  exec "sh" [info.path] Nothing
  Log.log "Done."