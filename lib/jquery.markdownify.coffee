( ($) -> 
    $.fn.markdownify = (options) ->
        if options and options["cloudinary"]
            cloudName = options["cloudinary"]["cloudName"]
            unsignedUploadingKey = options["cloudinary"]["unsignedUploadingKey"]

        this.each ->
            current_element = this
            editor = CodeMirror.fromTextArea(current_element, {
                mode: "markdown",
                lineNumbers: true,
                lineWrapping: true,
                theme: "default",
                extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
              })
            
            editor.on "change", ->
                $(current_element).html editor.getValue()
                return

            # change the default preview button text to the data attribute if it exists
            $previewButton = $(".btn--preview[data-target='#{current_element.id}']")

            # use sensible defaults if the user doesn't give us any
            defaultPreviewToggleText = $previewButton.text() or "Preview"
            defaultEditToggleText = $previewButton.data "toggle-text" or "Edit"

            # set the default text to what the user has given us (or the defaults)
            $previewButton.text defaultPreviewToggleText

            insertions = {
                el : (e) ->
                    editor.replaceSelection(e.data("prefix") + editor.getSelection())
                    if e.data("suffix")
                        editor.replaceSelection(e.data("suffix"), "start")
                    return
                ,
                link : ->
                    link = window.prompt("Enter an url").trim()
                    if link isnt null and link.length > 0
                        selection = editor.getSelection()
                        selection = if selection.length is 0 then link else selection
                        editor.replaceSelection("[#{selection}](#{link})")
                    return
                ,
                video : ->
                    videoLink = window.prompt("Enter a video url ex: https://www.youtube.com/watch?v=bGutVrdL3M8").trim()
                    if videoLink and videoLink.length > 0
                        editor.replaceSelection "\n#{videoLink}\n\n"
                    return
                ,
                img : (e) ->
                    $("##{e.parent('.markdownify-menu').data('target')}-upload_field").trigger "click"
                    return
            }

            $(".markdownify-menu[data-target='#{current_element.id}'] .btn--insert").click (ev) ->
                insertions[$(this).data("type") or "el"]($(this))
                editor.focus()
                ev.preventDefault()
                return

            $(".btn--preview[data-target='#{current_element.id}']").click (ev) ->
                # Cache the selector
                $this = $(this)

                $(editor.getWrapperElement()).toggleClass "markdownify--hidden"
                $(".#{$this.data('target')}-preview").toggleClass("markdownify--hidden").html(marked(($("##{$this.data('target')}")).html()))

                # When the input text is the same as the default, we use the opposite text (clicked v default)
                textToSwitchTo = if defaultPreviewToggleText is $this.text() then defaultEditToggleText else defaultPreviewToggleText

                $this.text textToSwitchTo
                return

            $(".#{current_element.id}-preview").toggleClass "markdownify--hidden"

            if cloudName
                $('body').append("
                  <form enctype='multipart/form-data'>
                    <input class='upload_field' data-target='#{current_element.id}' id='#{current_element.id}-upload_field' name='file' type='file'/>
                  </form> ")

                $(".upload_field[data-target=#{current_element.id }]").unsigned_cloudinary_upload(unsignedUploadingKey,
                  { cloud_name: cloudName, tags: "browser_uploads" },
                  { multiple: true }
                ).bind "cloudinarydone", (e, data) ->
                    editor.replaceSelection("![](#{$.cloudinary.url(data.result.public_id, {cloud_name: cloudName})})\n")
                    editor.focus()
                    return
                return

        this
    return
)(jQuery)