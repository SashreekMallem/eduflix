#!/bin/bash
# To resolve the APIRemovedInV1 error, run one of the following commands:

# Option 1: Migrate your code to the new OpenAI API (recommended)
openai migrate

# Option 2: Pin the OpenAI library to a pre-1.0 version (e.g., 0.28.0)
# pip install "openai==0.28.0"
