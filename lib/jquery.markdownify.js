(function (root, factory) {
  /* UMD definition */
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    root.markdownify = factory(jQuery);
  }
}(this, function ($) {

  var markdownify = function (options) {
    if (options && options['cloudinary']) {
      var cloudName = options['cloudinary']['cloudName'];
      var unsignedUploadingKey = options['cloudinary']['unsignedUploadingKey'];
    }

    var divs = document.querySelectorAll(options.selector);

    [].forEach.call(divs, function (div) {

      current_element = div;

      var editor = CodeMirror.fromTextArea(current_element, {
        mode: 'markdown',
        lineNumbers: true,
        lineWrapping: true,
        theme: "default",
        extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
      });

      editor.on('change', function () {
        current_element.innerHTML = editor.getValue()
      });

      // change the default preview button text to the data attribute if it exists
      var previewButton = document.querySelector('.btn--preview[data-target="' + current_element.id + '"]');

      var defaultPreviewToggleText = 'Preview';
      var defaultEditToggleText = 'Edit';

      if(previewButton) {

        // use sensible defaults if the user doesn't give us any
        defaultPreviewToggleText = previewButton.innerText || defaultPreviewToggleText;
        defaultEditToggleText = previewButton.dataset['toggle-text'] || defaultEditToggleText;

        // set the default text to what the user has given us (or the defaults)
        previewButton.innerText = defaultPreviewToggleText;

      }

      var insertions = {
        el: function (e) {
          editor.replaceSelection(e.dataset.prefix + editor.getSelection());
          if (e.dataset.suffix) {
            editor.replaceSelection(e.dataset.suffix, 'start');
          }
        },
        link: function () {
          var link = window.prompt('Enter an url');
          link = String.prototype.trim(link);
          if (link !== null) {
            editor.replaceSelection('[' + link + '](' + link + ')')
          }
        },
        video: function () {
          var videoLink = window.prompt('Enter a video url ex: https://www.youtube.com/watch?v=bGutVrdL3M8');
          if (videoLink) {
            editor.replaceSelection("\n" + String.prototype.trim(videoLink) + "\n\n")
          }
        },
        img: function (e) {
          var el = document.querySelector('#' + e.parentNode.dataset.target + "-upload_field");
          /* @see http://stackoverflow.com/a/2381862/1955940 */
          el.click();
        }
      }

      var insertButtons = document
        .querySelectorAll('.markdownify-menu[data-target="' + current_element.id + '"] .btn--insert');

      [].forEach.call(insertButtons, function (div) {

        div.onclick = function (ev) {
          insertions[this.dataset.type || 'el'](this);
          editor.focus();
          ev.preventDefault();
        };

      });

        var previewButtons = document
          .querySelectorAll('.btn--preview[data-target="' + current_element.id + '"]');

        [].forEach.call(previewButtons, function (div) {

          div.onclick = function (ev) {

            editor.classList.toggle('markdownify--hidden');

            var el = document
              .querySelector('.' + div.dataset.target + '-preview');
            el.classList.toggle('markdownify--hidden');
            el.innerHTML = marked((document
              .querySelector('#' + div.dataset.target)).innerHTML);

            // When the input text is the same as the default,
            // we use the opposite text (clicked v default)
            var textToSwitchTo = defaultPreviewToggleText ===
                                 div.innerHTML ?
                                 defaultEditToggleText :
                                 defaultPreviewToggleText;

            div.innerHTML = textToSwitchTo;
          }

        });

      $('.' + current_element.id + '-preview').toggleClass('markdownify--hidden')

      if (cloudName) {
        $('body').append("\
          <form enctype='multipart/form-data'>\
            <input class='upload_field' data-target='" + current_element.id + "' id='" + current_element.id + "-upload_field' name='file' type='file'/>\
          </form>\
        ")


        $('.upload_field[data-target=' + current_element.id + ']').unsigned_cloudinary_upload(unsignedUploadingKey,
          { cloud_name: cloudName, tags: 'browser_uploads' },
          { multiple: true }
        ).bind('cloudinarydone', function(e, data) {
            editor.replaceSelection('![](' + $.cloudinary.url(data.result.public_id, {cloud_name: cloudName}) + ")\n");
            editor.focus();
          });
      }
    })
    return this;
  }

  return markdownify;

}));
